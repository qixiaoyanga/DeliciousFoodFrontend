<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { deliveryAuthApi, deliveryOrderApi, deliveryInfoApi } from '@/api/delivery'
import { tokenManager } from '@/utils/token'
import { toast } from '@/utils/toast'
import * as echarts from 'echarts'
import type { DeliveryInfo, DeliveryOrder, DeliveryDashboard } from '@/types'

const router = useRouter()
const activeTab = ref('available')
const isLoading = ref(false)

const currentRider = ref(tokenManager.getUser() || { uid: '', username: '骑手', phone: '' })

// ==================== 订单大厅 ====================
const availableOrders = ref<DeliveryOrder[]>([])

const loadAvailableOrders = async () => {
  isLoading.value = true
  try {
    const result = await deliveryOrderApi.getAvailable()
    availableOrders.value = result || []
  } catch (error: any) {
    toast.error(error.message || '加载订单失败')
    availableOrders.value = []
  } finally {
    isLoading.value = false
  }
}

const showPickupModal = ref(false)
const currentPickupCode = ref('')

const acceptOrder = async (order: DeliveryOrder) => {
  if (!confirm(`确认接单？\n店铺：${order.shopName}\n地址：${order.shopAddress}\n配送费：¥${order.deliveryFee.toFixed(2)}`)) return
  try {
    const code = await deliveryOrderApi.accept(order.id)
    currentPickupCode.value = code || '无'
    showPickupModal.value = true
    loadAvailableOrders()
    loadMyOrders()
  } catch (error: any) {
    toast.error(error.message || '接单失败')
  }
}

const getOrderStatusText = (status: number) => {
  const map: Record<number, string> = { 2: '待接单', 4: '配送中', 5: '已送达' }
  return map[status] || '未知'
}

// ==================== 我的配送 ====================
const myOrders = ref<DeliveryOrder[]>([])

const loadMyOrders = async () => {
  isLoading.value = true
  try {
    const result = await deliveryOrderApi.getMyOrders()
    myOrders.value = result || []
  } catch (error: any) {
    toast.error(error.message || '加载配送列表失败')
    myOrders.value = []
  } finally {
    isLoading.value = false
  }
}

const completeOrder = async (order: DeliveryOrder) => {
  if (!confirm(`确认送达？\n订单号：${order.orderNo}\n地址：${order.address}\n配送费：¥${order.deliveryFee.toFixed(2)}`)) return
  try {
    await deliveryOrderApi.complete(order.id)
    toast.success('配送完成！收入已结算')
    loadMyOrders()
    loadDashboard()
  } catch (error: any) {
    toast.error(error.message || '操作失败')
  }
}

// ==================== 我的信息 ====================
const riderInfo = ref<DeliveryInfo>({
  id: '', phone: '', email: '', realName: '', idCard: '',
  balance: 0, status: 0, registerTime: '', lastLoginTime: null
})
const editInfo = ref({ realName: '', email: '', idCard: '' })
const isEditing = ref(false)

const loadInfo = async () => {
  isLoading.value = true
  try {
    const result = await deliveryInfoApi.getInfo()
    if (result) {
      riderInfo.value = result
      editInfo.value = { realName: result.realName || '', email: result.email || '', idCard: result.idCard || '' }
    }
  } catch (error: any) {
    toast.error(error.message || '加载个人信息失败')
  } finally {
    isLoading.value = false
  }
}

const saveInfo = async () => {
  try {
    await deliveryInfoApi.update(editInfo.value)
    toast.success('信息更新成功')
    isEditing.value = false
    loadInfo()
  } catch (error: any) {
    toast.error(error.message || '更新失败')
  }
}

// ==================== 数据看板 ====================
const dashboard = ref<DeliveryDashboard>({
  todayCompleted: 0, todayIncome: 0, totalCompleted: 0, totalIncome: 0,
  pendingOrders: 0, deliveringOrders: 0, weekCompleted: [], weekIncome: [], weekLabels: []
})
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const loadDashboard = async () => {
  try {
    const result = await deliveryInfoApi.getDashboard()
    if (result) {
      dashboard.value = result
      await nextTick()
      updateChart()
    }
  } catch (error: any) {
    toast.error(error.message || '加载看板失败')
  }
}

const updateChart = () => {
  if (!chart && chartRef.value) chart = echarts.init(chartRef.value)
  if (chart) {
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['完成单数', '收入'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dashboard.value.weekLabels },
      yAxis: [
        { type: 'value', name: '单数' },
        { type: 'value', name: '收入(元)' }
      ],
      series: [
        { name: '完成单数', type: 'bar', data: dashboard.value.weekCompleted, itemStyle: { color: '#22c55e' } },
        { name: '收入', type: 'line', yAxisIndex: 1, smooth: true, data: dashboard.value.weekIncome, lineStyle: { color: '#eab308', width: 3 }, itemStyle: { color: '#eab308' } }
      ]
    })
  }
}

const handleResize = () => chart?.resize()

// ==================== Tab 切换 ====================
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'available') loadAvailableOrders()
  else if (tab === 'orders') loadMyOrders()
  else if (tab === 'info') loadInfo()
  else if (tab === 'dashboard') loadDashboard()
}

// ==================== 退出 ====================
const logout = () => {
  tokenManager.clearTokens()
  router.push('/delivery/login')
}

onMounted(() => {
  loadAvailableOrders()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="delivery-page">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon">🛵</div>
          <div class="logo-text">
            <h2>骑手配送端</h2>
            <p>DeliciousFood</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item" :class="{ active: activeTab === 'available' }" @click="handleTabChange('available')">
          <span class="nav-icon">📦</span><span class="nav-text">订单大厅</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'orders' }" @click="handleTabChange('orders')">
          <span class="nav-icon">📋</span><span class="nav-text">我的配送</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'info' }" @click="handleTabChange('info')">
          <span class="nav-icon">👤</span><span class="nav-text">我的信息</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="handleTabChange('dashboard')">
          <span class="nav-icon">📊</span><span class="nav-text">数据看板</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout">
          <span class="nav-icon">🚪</span><span class="nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容 -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-info">
          <div class="user-avatar"><span class="avatar-icon">🛵</span></div>
          <div class="user-details">
            <h3>{{ currentRider.username || '骑手' }}</h3>
            <p>骑手 | {{ currentRider.phone }}</p>
          </div>
        </div>
        <span class="current-time">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span>
      </header>

      <div class="content-area">
        <div v-if="isLoading" class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>

        <!-- 订单大厅 -->
        <template v-else-if="activeTab === 'available'">
          <div class="section-header"><h3 class="section-title">可接订单</h3><span class="order-count">共 {{ availableOrders.length }} 单</span></div>
          <div v-if="availableOrders.length === 0" class="empty-state"><div class="empty-icon">📦</div><p>暂无可接订单</p></div>
          <div v-else class="order-grid">
            <div v-for="order in availableOrders" :key="order.id" class="order-card">
              <div class="order-card-header">
                <span class="order-no">订单号：{{ order.orderNo }}</span>
                <span class="order-fee">配送费 ¥{{ order.deliveryFee.toFixed(2) }}</span>
              </div>
              <div class="order-card-body">
                <div class="order-info-row"><span class="label">店铺：</span><span>{{ order.shopName }}</span></div>
                <div class="order-info-row"><span class="label">店铺地址：</span><span>{{ order.shopAddress || '-' }}</span></div>
                <div class="order-info-row"><span class="label">收货人：</span><span>{{ order.consignee || '-' }} {{ order.consigneePhone || '' }}</span></div>
                <div class="order-info-row"><span class="label">收货地址：</span><span class="highlight">{{ order.fullAddress || '-' }}</span></div>
                <div class="order-info-row" v-if="order.remark"><span class="label">备注：</span><span class="remark">{{ order.remark }}</span></div>
              </div>
              <div class="order-card-footer">
                <button class="accept-btn" @click="acceptOrder(order)">接单</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 我的配送 -->
        <template v-else-if="activeTab === 'orders'">
          <div class="section-header"><h3 class="section-title">我的配送</h3></div>
          <div v-if="myOrders.length === 0" class="empty-state"><div class="empty-icon">📋</div><p>暂无配送订单</p></div>
          <div v-else class="order-grid">
            <div v-for="order in myOrders" :key="order.id" class="order-card" :class="{ delivering: order.status === 4 }">
              <div class="order-card-header">
                <span class="order-no">订单号：{{ order.orderNo }}</span>
                <span class="order-status" :class="order.status === 4 ? 'status-delivering' : 'status-done'">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
              <div class="order-card-body">
                <div class="order-info-row"><span class="label">店铺：</span><span>{{ order.shopName }}</span></div>
                <div class="order-info-row"><span class="label">收货人：</span><span>{{ order.consignee || '-' }} {{ order.consigneePhone || '' }}</span></div>
                <div class="order-info-row"><span class="label">收货地址：</span><span class="highlight">{{ order.fullAddress || '-' }}</span></div>
                <div class="order-info-row"><span class="label">配送费：</span><span class="highlight">¥{{ order.deliveryFee.toFixed(2) }}</span></div>
                <div class="order-info-row" v-if="order.pickupCode"><span class="label">取件码：</span><span class="pickup-code">{{ order.pickupCode }}</span></div>
              </div>
              <div class="order-card-footer" v-if="order.status === 4">
                <button class="complete-btn" @click="completeOrder(order)">确认送达</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 我的信息 -->
        <template v-else-if="activeTab === 'info'">
          <div class="section-header"><h3 class="section-title">我的信息</h3><button class="edit-btn" @click="isEditing = !isEditing">{{ isEditing ? '取消' : '编辑' }}</button></div>
          <div class="info-card">
            <div class="info-grid">
              <div class="info-item"><span class="label">手机号</span><span class="value">{{ riderInfo.phone }}</span></div>
              <div class="info-item">
                <span class="label">姓名</span>
                <input v-if="isEditing" v-model="editInfo.realName" class="edit-input" />
                <span v-else class="value">{{ riderInfo.realName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">邮箱</span>
                <input v-if="isEditing" v-model="editInfo.email" class="edit-input" />
                <span v-else class="value">{{ riderInfo.email || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">身份证号</span>
                <input v-if="isEditing" v-model="editInfo.idCard" class="edit-input" />
                <span v-else class="value">{{ riderInfo.idCard || '-' }}</span>
              </div>
              <div class="info-item"><span class="label">账户余额</span><span class="value highlight">¥{{ riderInfo.balance.toFixed(2) }}</span></div>
              <div class="info-item"><span class="label">注册时间</span><span class="value">{{ riderInfo.registerTime || '-' }}</span></div>
              <div class="info-item"><span class="label">最后登录</span><span class="value">{{ riderInfo.lastLoginTime || '-' }}</span></div>
            </div>
            <button v-if="isEditing" class="save-btn" @click="saveInfo">保存修改</button>
          </div>
        </template>

        <!-- 数据看板 -->
        <template v-else-if="activeTab === 'dashboard'">
          <div class="section-header"><h3 class="section-title">数据看板</h3></div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-info"><p class="stat-value">{{ dashboard.todayCompleted }}</p><p class="stat-label">今日完成</p></div></div>
            <div class="stat-card"><div class="stat-icon yellow">💰</div><div class="stat-info"><p class="stat-value">¥{{ dashboard.todayIncome.toFixed(2) }}</p><p class="stat-label">今日收入</p></div></div>
            <div class="stat-card"><div class="stat-icon blue">📦</div><div class="stat-info"><p class="stat-value">{{ dashboard.totalCompleted }}</p><p class="stat-label">累计完成</p></div></div>
            <div class="stat-card"><div class="stat-icon purple">💎</div><div class="stat-info"><p class="stat-value">¥{{ dashboard.totalIncome.toFixed(2) }}</p><p class="stat-label">累计收入</p></div></div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">近7天配送趋势</h3>
            <div ref="chartRef" class="chart-container"></div>
          </div>
        </template>
      </div>
    </main>

    <!-- 取件码弹窗 -->
    <div v-if="showPickupModal" class="modal-overlay" @click.self="showPickupModal = false">
      <div class="pickup-modal">
        <div class="pickup-modal-icon">📦</div>
        <h3>接单成功！</h3>
        <p class="pickup-label">取件码</p>
        <p class="pickup-code-display">{{ currentPickupCode }}</p>
        <p class="pickup-tip">请向商家出示取件码</p>
        <button class="pickup-close-btn" @click="showPickupModal = false">知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delivery-page { display: flex; min-height: 100vh; background: #f5f7fa; }

.sidebar { width: 260px; background: #14532d; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 100; }
.sidebar-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.logo-section { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 36px; }
.logo-text h2 { font-size: 18px; font-weight: 700; color: #fff; margin: 0; }
.logo-text p { font-size: 12px; color: rgba(255,255,255,0.4); margin: 4px 0 0; }
.sidebar-nav { flex: 1; padding: 16px; }
.nav-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 4px; border: none; background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); color: rgba(255,255,255,0.6); }
.nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
.nav-item.active { background: rgba(34,197,94,0.2); color: #4ade80; }
.nav-icon { font-size: 20px; }
.nav-text { font-size: 15px; font-weight: 500; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.logout-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: none; background: transparent; border-radius: var(--radius-md); cursor: pointer; color: rgba(239,68,68,0.7); transition: all var(--transition-fast); }
.logout-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.main-content { flex: 1; margin-left: 260px; }
.top-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: var(--bg-card); border-bottom: 1px solid var(--border-color); }
.header-info { display: flex; align-items: center; gap: 16px; }
.user-avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #14532d; }
.avatar-icon { font-size: 28px; }
.user-details h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
.user-details p { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
.current-time { font-size: 14px; color: var(--text-secondary); }

.content-area { padding: 32px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-title { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0; }
.order-count { font-size: 14px; color: var(--text-muted); }
.edit-btn { padding: 8px 20px; background: #22c55e; color: white; border: none; border-radius: var(--radius-md); font-size: 14px; cursor: pointer; }

.loading-container { display: flex; flex-direction: column; align-items: center; padding: 60px; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: #22c55e; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; }
.empty-icon { font-size: 64px; margin-bottom: 16px; }
.empty-state p { font-size: 16px; color: var(--text-muted); }

.order-grid { display: flex; flex-direction: column; gap: 16px; }
.order-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); }
.order-card.delivering { border-left: 4px solid #f59e0b; }
.order-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-no { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.order-fee { font-size: 16px; font-weight: 700; color: #22c55e; }
.order-status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status-delivering { background: rgba(245,158,11,0.1); color: #f59e0b; }
.status-done { background: rgba(34,197,94,0.1); color: #22c55e; }
.order-card-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.order-info-row { font-size: 14px; }
.order-info-row .label { color: var(--text-muted); }
.order-info-row .highlight { color: #22c55e; font-weight: 700; }
.remark { color: #f59e0b; }
.order-card-footer { display: flex; justify-content: flex-end; }
.accept-btn { padding: 10px 32px; background: #22c55e; color: white; border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.accept-btn:hover { background: #16a34a; }
.complete-btn { padding: 10px 32px; background: #f59e0b; color: white; border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.complete-btn:hover { background: #d97706; }

.info-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm); }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-item .label { font-size: 13px; color: var(--text-muted); }
.info-item .value { font-size: 16px; color: var(--text-primary); font-weight: 500; }
.info-item .value.highlight { color: #22c55e; font-weight: 700; font-size: 20px; }
.edit-input { padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 15px; color: var(--text-primary); outline: none; }
.edit-input:focus { border-color: #22c55e; }
.save-btn { padding: 12px 32px; background: #22c55e; color: white; border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.save-btn:hover { background: #16a34a; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
.stat-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm); }
.stat-icon { width: 64px; height: 64px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.stat-icon.green { background: rgba(34,197,94,0.1); }
.stat-icon.yellow { background: rgba(234,179,8,0.1); }
.stat-icon.blue { background: rgba(59,130,246,0.1); }
.stat-icon.purple { background: rgba(168,85,247,0.1); }
.stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0; }
.stat-label { font-size: 14px; color: var(--text-muted); margin: 4px 0 0; }

.chart-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
.chart-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px; }
.chart-container { width: 100%; height: 300px; }

.pickup-code { color: #f59e0b; font-weight: 700; font-size: 16px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.pickup-modal { background: white; border-radius: var(--radius-lg); padding: 48px; text-align: center; max-width: 380px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.pickup-modal-icon { font-size: 64px; margin-bottom: 16px; }
.pickup-modal h3 { font-size: 20px; font-weight: 600; color: #22c55e; margin: 0 0 20px; }
.pickup-label { font-size: 14px; color: var(--text-muted); margin: 0 0 8px; }
.pickup-code-display { font-size: 42px; font-weight: 800; color: #f59e0b; letter-spacing: 8px; margin: 0 0 16px; font-family: monospace; }
.pickup-tip { font-size: 13px; color: var(--text-muted); margin: 0 0 24px; }
.pickup-close-btn { padding: 12px 40px; background: #22c55e; color: white; border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.pickup-close-btn:hover { background: #16a34a; }

@media screen and (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media screen and (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } .stats-grid { grid-template-columns: 1fr; } .info-grid { grid-template-columns: 1fr; } }
</style>
