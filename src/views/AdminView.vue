<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { adminAuthApi, adminDashboardApi, adminUserApi, adminShopApi, adminDeliveryApi } from '@/api/admin'
import { tokenManager } from '@/utils/token'
import { toast } from '@/utils/toast'
import * as echarts from 'echarts'
import type { AdminDashboard, AdminUser, AdminShop, AdminDelivery, PageVO } from '@/types'

const router = useRouter()
const activeTab = ref('dashboard')
const isLoading = ref(false)

// 当前登录管理员
const currentAdmin = ref(tokenManager.getUser() || { uid: '', username: '管理员', phone: '' })

// ==================== 数据看板 ====================
const dashboardInfo = ref<AdminDashboard>({
  totalUsers: 0,
  totalMerchants: 0,
  totalOrders: 0,
  totalRevenue: 0,
  todayNewUsers: 0,
  todayNewOrders: 0,
  pendingAuditShops: 0,
  userGrowth: [],
  orderTrend: [],
  weekLabels: []
})

const userGrowthChartRef = ref<HTMLElement | null>(null)
const orderTrendChartRef = ref<HTMLElement | null>(null)
let userGrowthChart: echarts.ECharts | null = null
let orderTrendChart: echarts.ECharts | null = null

const loadDashboard = async () => {
  isLoading.value = true
  try {
    const result = await adminDashboardApi.getInfo()
    if (result) {
      dashboardInfo.value = result
      await nextTick()
      updateCharts()
    }
  } catch (error: any) {
    toast.error(error.message || '加载数据看板失败')
  } finally {
    isLoading.value = false
  }
}

const initCharts = () => {
  if (userGrowthChartRef.value) {
    userGrowthChart = echarts.init(userGrowthChartRef.value)
  }
  if (orderTrendChartRef.value) {
    orderTrendChart = echarts.init(orderTrendChartRef.value)
  }
}

const updateCharts = () => {
  if (userGrowthChart) {
    userGrowthChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dashboardInfo.value.weekLabels },
      yAxis: { type: 'value' },
      series: [{
        name: '总用户数',
        type: 'line',
        smooth: true,
        data: dashboardInfo.value.userGrowth.map(Number),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(52, 152, 219, 0.3)' },
            { offset: 1, color: 'rgba(52, 152, 219, 0.05)' }
          ])
        },
        lineStyle: { color: '#3498db', width: 3 },
        itemStyle: { color: '#3498db' }
      }]
    })
  }

  if (orderTrendChart) {
    orderTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dashboardInfo.value.weekLabels },
      yAxis: { type: 'value' },
      series: [{
        name: '订单数',
        type: 'bar',
        data: dashboardInfo.value.orderTrend.map(Number),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff6b35' },
            { offset: 1, color: '#ffc300' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }]
    })
  }
}

const handleResize = () => {
  userGrowthChart?.resize()
  orderTrendChart?.resize()
}

// ==================== 用户管理 ====================
const userList = ref<AdminUser[]>([])
const userPage = ref({ current: 1, size: 10, total: 0, pages: 0 })
const userKeyword = ref('')
const userStatusFilter = ref<number | undefined>(undefined)
const showUserDetailModal = ref(false)
const currentUserDetail = ref<AdminUser | null>(null)
const userProfile = ref<any>(null)
const profileLoading = ref(false)

const loadUserList = async () => {
  isLoading.value = true
  try {
    const result = await adminUserApi.getList({
      page: userPage.value.current,
      size: userPage.value.size,
      keyword: userKeyword.value || undefined,
      status: userStatusFilter.value
    })
    if (result) {
      userList.value = result.records
      userPage.value = { ...result }
    }
  } catch (error: any) {
    toast.error(error.message || '加载用户列表失败')
  } finally {
    isLoading.value = false
  }
}

const searchUsers = () => {
  userPage.value.current = 1
  loadUserList()
}

const updateUserStatus = async (user: AdminUser, newStatus: number) => {
  const actionMap: Record<number, string> = { 0: '恢复', 1: '注销', 2: '封禁' }
  const actionText = actionMap[newStatus] || '操作'
  if (!confirm(`确定要${actionText}该用户（${user.phone}）吗？`)) return
  try {
    await adminUserApi.updateStatus(user.phone, newStatus)
    toast.success(`用户已${actionText}`)
    loadUserList()
  } catch (error: any) {
    toast.error(error.message || '操作失败')
  }
}

const viewUserDetail = async (user: AdminUser) => {
  currentUserDetail.value = user
  showUserDetailModal.value = true
  userProfile.value = null
  profileLoading.value = true
  try {
    userProfile.value = await adminUserApi.getProfile(user.uid)
  } catch {
    userProfile.value = null
  } finally {
    profileLoading.value = false
  }
}

const getLevelText = (level: string) => {
  const map: Record<string, string> = { LOW: '低消费', MEDIUM: '中等', HIGH: '高消费', VIP: 'VIP' }
  return map[level] || level || '-'
}
const getFreqText = (freq: string) => {
  const map: Record<string, string> = { OCCASIONAL: '偶尔', REGULAR: '规律', FREQUENT: '频繁' }
  return map[freq] || freq || '-'
}
const getRatioPercent = (ratio: number) => ratio != null ? (ratio * 100).toFixed(0) + '%' : '-'

const getUserStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '正常', 1: '注销', 2: '封禁' }
  return map[status] || '未知'
}

const getUserStatusClass = (status: number) => {
  const map: Record<number, string> = { 0: 'status-normal', 1: 'status-canceled', 2: 'status-banned' }
  return map[status] || ''
}

const getMemberLevelText = (level: number) => {
  const map: Record<number, string> = { 1: '白银', 2: '黄金', 3: '钻石' }
  return map[level] || '未知'
}

// ==================== 商家管理 ====================
const shopList = ref<AdminShop[]>([])
const shopPage = ref({ current: 1, size: 10, total: 0, pages: 0 })
const shopKeyword = ref('')
const shopAuditFilter = ref<number | undefined>(undefined)
const shopStatusFilter = ref<number | undefined>(undefined)
const showAuditModal = ref(false)
const showShopDetailModal = ref(false)
const currentShop = ref<AdminShop | null>(null)
const auditForm = ref({ auditStatus: 2, rejectReason: '' })

const loadShopList = async () => {
  isLoading.value = true
  try {
    const result = await adminShopApi.getList({
      page: shopPage.value.current,
      size: shopPage.value.size,
      keyword: shopKeyword.value || undefined,
      auditStatus: shopAuditFilter.value,
      shopStatus: shopStatusFilter.value
    })
    if (result) {
      shopList.value = result.records
      shopPage.value = { ...result }
    }
  } catch (error: any) {
    toast.error(error.message || '加载商家列表失败')
  } finally {
    isLoading.value = false
  }
}

const searchShops = () => {
  shopPage.value.current = 1
  loadShopList()
}

const openAuditModal = (shop: AdminShop, approve: boolean) => {
  currentShop.value = shop
  auditForm.value = { auditStatus: approve ? 2 : 3, rejectReason: '' }
  showAuditModal.value = true
}

const closeAuditModal = () => {
  showAuditModal.value = false
  currentShop.value = null
}

const confirmAudit = async () => {
  if (!currentShop.value) return
  if (auditForm.value.auditStatus === 3 && !auditForm.value.rejectReason.trim()) {
    toast.error('驳回时请填写驳回原因')
    return
  }
  try {
    await adminShopApi.audit(currentShop.value.id, {
      shopId: currentShop.value.id,
      auditStatus: auditForm.value.auditStatus,
      rejectReason: auditForm.value.rejectReason || undefined
    })
    toast.success(auditForm.value.auditStatus === 2 ? '审核通过' : '已驳回')
    closeAuditModal()
    loadShopList()
    loadDashboard()
  } catch (error: any) {
    toast.error(error.message || '操作失败')
  }
}

const toggleShopStatus = async (shop: AdminShop) => {
  const newStatus = shop.shopStatus === 0 ? 1 : 0
  const actionText = newStatus === 1 ? '禁用' : '启用'
  if (!confirm(`确定要${actionText}该商家吗？`)) return
  try {
    await adminShopApi.updateStatus(shop.id, newStatus)
    toast.success(`商家已${actionText}`)
    loadShopList()
  } catch (error: any) {
    toast.error(error.message || '操作失败')
  }
}

const viewShopDetail = async (shop: AdminShop) => {
  try {
    const detail = await adminShopApi.getDetail(shop.id)
    if (detail) {
      currentShop.value = detail
      showShopDetailModal.value = true
    }
  } catch (error: any) {
    toast.error(error.message || '获取商家详情失败')
  }
}

const getAuditStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '未提交', 1: '审核中', 2: '通过', 3: '驳回' }
  return map[status] || '未知'
}

const getAuditStatusClass = (status: number) => {
  const map: Record<number, string> = { 0: 'audit-none', 1: 'audit-pending', 2: 'audit-approved', 3: 'audit-rejected' }
  return map[status] || ''
}

const getShopStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '启用', 1: '禁用', 2: '注销' }
  return map[status] || '未知'
}

// ==================== 骑手管理 ====================
const deliveryList = ref<AdminDelivery[]>([])
const deliveryPage = ref({ current: 1, size: 10, total: 0, pages: 0 })
const deliveryKeyword = ref('')
const deliveryStatusFilter = ref<number | undefined>(undefined)

const loadDeliveryList = async () => {
  isLoading.value = true
  try {
    const result = await adminDeliveryApi.getList({
      page: deliveryPage.value.current,
      size: deliveryPage.value.size,
      keyword: deliveryKeyword.value || undefined,
      status: deliveryStatusFilter.value
    })
    if (result) {
      deliveryList.value = result.records
      deliveryPage.value = { ...result }
    }
  } catch (error: any) {
    toast.error(error.message || '加载骑手列表失败')
  } finally {
    isLoading.value = false
  }
}

const searchDeliveries = () => {
  deliveryPage.value.current = 1
  loadDeliveryList()
}

const toggleDeliveryStatus = async (delivery: AdminDelivery) => {
  const newStatus = delivery.status === 0 ? 1 : 0
  const actionText = newStatus === 1 ? '禁用' : '启用'
  if (!confirm(`确定要${actionText}该骑手吗？`)) return
  try {
    await adminDeliveryApi.updateStatus(delivery.id, newStatus)
    toast.success(`骑手已${actionText}`)
    loadDeliveryList()
  } catch (error: any) {
    toast.error(error.message || '操作失败')
  }
}

const getDeliveryStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '正常', 1: '禁用' }
  return map[status] || '未知'
}

// ==================== Tab 切换 ====================
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'dashboard') {
    loadDashboard()
  } else if (tab === 'users') {
    loadUserList()
  } else if (tab === 'shops') {
    loadShopList()
  } else if (tab === 'delivery') {
    loadDeliveryList()
  }
}

// ==================== 退出 ====================
const logout = () => {
  tokenManager.clearTokens()
  router.push('/admin/login')
}

// ==================== 分页 ====================
const changeUserPage = (page: number) => {
  userPage.value.current = page
  loadUserList()
}

const changeShopPage = (page: number) => {
  shopPage.value.current = page
  loadShopList()
}

const changeDeliveryPage = (page: number) => {
  deliveryPage.value.current = page
  loadDeliveryList()
}

// 分页按钮生成
const getPageNumbers = (current: number, total: number) => {
  const pages: number[] = []
  const maxShow = 5
  let start = Math.max(1, current - Math.floor(maxShow / 2))
  const end = Math.min(total, start + maxShow - 1)
  if (end - start + 1 < maxShow) {
    start = Math.max(1, end - maxShow + 1)
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
  nextTick(() => initCharts())
})
</script>

<template>
  <div class="admin-page">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon">🛡️</div>
          <div class="logo-text">
            <h2>管理后台</h2>
            <p>DeliciousFood</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'dashboard' }"
          @click="handleTabChange('dashboard')"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-text">数据看板</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'users' }"
          @click="handleTabChange('users')"
        >
          <span class="nav-icon">👤</span>
          <span class="nav-text">用户管理</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'shops' }"
          @click="handleTabChange('shops')"
        >
          <span class="nav-icon">🏪</span>
          <span class="nav-text">商家管理</span>
          <span v-if="dashboardInfo.pendingAuditShops > 0" class="nav-badge">
            {{ dashboardInfo.pendingAuditShops }}
          </span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'delivery' }"
          @click="handleTabChange('delivery')"
        >
          <span class="nav-icon">🛵</span>
          <span class="nav-text">骑手管理</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="top-header">
        <div class="header-info">
          <div class="user-avatar">
            <span class="avatar-icon">👑</span>
          </div>
          <div class="user-details">
            <h3>{{ currentAdmin.username || '管理员' }}</h3>
            <p>超级管理员 | {{ currentAdmin.phone }}</p>
          </div>
        </div>
        <div class="header-actions">
          <span class="current-time">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span>
        </div>
      </header>

      <div class="content-area">
        <!-- ==================== 数据看板 ==================== -->
        <div v-if="activeTab === 'dashboard'" class="tab-content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon users-icon">👤</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.totalUsers }}</p>
                <p class="stat-label">总用户数</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon merchants-icon">🏪</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.totalMerchants }}</p>
                <p class="stat-label">总商家数</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon orders-icon">📋</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.totalOrders }}</p>
                <p class="stat-label">总订单数</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon revenue-icon">💰</div>
              <div class="stat-info">
                <p class="stat-value">¥{{ (dashboardInfo.totalRevenue || 0).toFixed(2) }}</p>
                <p class="stat-label">总营收</p>
              </div>
            </div>
          </div>

          <div class="stats-grid secondary">
            <div class="stat-card">
              <div class="stat-icon today-users-icon">🆕</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.todayNewUsers }}</p>
                <p class="stat-label">今日新增用户</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon today-orders-icon">📦</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.todayNewOrders }}</p>
                <p class="stat-label">今日新增订单</p>
              </div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-icon pending-icon">⏳</div>
              <div class="stat-info">
                <p class="stat-value">{{ dashboardInfo.pendingAuditShops }}</p>
                <p class="stat-label">待审核商家</p>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3 class="chart-title">近7天用户增长趋势</h3>
              <div ref="userGrowthChartRef" class="chart-container"></div>
            </div>
            <div class="chart-card">
              <h3 class="chart-title">近7天订单趋势</h3>
              <div ref="orderTrendChartRef" class="chart-container"></div>
            </div>
          </div>

          <div class="quick-actions">
            <h3 class="section-title">快捷操作</h3>
            <div class="action-buttons">
              <button class="action-btn" @click="handleTabChange('users')">
                <span class="action-icon">👤</span>
                <span class="action-text">用户管理</span>
              </button>
              <button class="action-btn" @click="handleTabChange('shops')">
                <span class="action-icon">🏪</span>
                <span class="action-text">商家管理</span>
              </button>
              <button class="action-btn" @click="handleTabChange('delivery')">
                <span class="action-icon">🛵</span>
                <span class="action-text">骑手管理</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== 用户管理 ==================== -->
        <div v-else-if="activeTab === 'users'" class="tab-content">
          <div class="section-header">
            <h3 class="section-title">用户管理</h3>
          </div>

          <!-- 搜索和筛选 -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <input
                v-model="userKeyword"
                type="text"
                class="search-input"
                placeholder="搜索用户名/手机号/邮箱..."
                @keyup.enter="searchUsers"
              />
              <button class="search-btn" @click="searchUsers">搜索</button>
            </div>
            <select v-model.number="userStatusFilter" class="filter-select" @change="searchUsers">
              <option :value="undefined">全部状态</option>
              <option :value="0">正常</option>
              <option :value="1">注销</option>
              <option :value="2">封禁</option>
            </select>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <!-- 表格 -->
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>手机号</th>
                  <th>邮箱</th>
                  <th>会员等级</th>
                  <th>余额</th>
                  <th>状态</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in userList" :key="user.uid">
                  <td>{{ user.uid }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.phone }}</td>
                  <td>{{ user.email || '-' }}</td>
                  <td>
                    <span class="member-badge" :class="'level-' + user.memberLevel">
                      {{ getMemberLevelText(user.memberLevel) }}
                    </span>
                  </td>
                  <td>¥{{ (user.balance || 0).toFixed(2) }}</td>
                  <td>
                    <span class="status-badge" :class="getUserStatusClass(user.status)">
                      {{ getUserStatusText(user.status) }}
                    </span>
                  </td>
                  <td>{{ user.registerTime || '-' }}</td>
                  <td class="action-cell">
                    <button class="action-btn-small" @click="viewUserDetail(user)">详情</button>
                    <template v-if="user.status !== 0">
                      <button class="action-btn-small primary" @click="updateUserStatus(user, 0)">恢复</button>
                    </template>
                    <template v-if="user.status !== 1">
                      <button class="action-btn-small" @click="updateUserStatus(user, 1)">注销</button>
                    </template>
                    <template v-if="user.status !== 2">
                      <button class="action-btn-small danger" @click="updateUserStatus(user, 2)">封禁</button>
                    </template>
                  </td>
                </tr>
                <tr v-if="userList.length === 0">
                  <td colspan="9" class="empty-row">暂无用户数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="userPage.pages > 1" class="pagination">
            <button class="page-btn" :disabled="Number(userPage.current) <= 1" @click="changeUserPage(Number(userPage.current) - 1)">上一页</button>
            <button
              v-for="p in getPageNumbers(Number(userPage.current), Number(userPage.pages))"
              :key="p"
              class="page-btn"
              :class="{ active: p === Number(userPage.current) }"
              @click="changeUserPage(p)"
            >
              {{ p }}
            </button>
            <button class="page-btn" :disabled="Number(userPage.current) >= Number(userPage.pages)" @click="changeUserPage(Number(userPage.current) + 1)">下一页</button>
            <span class="page-info">共 {{ userPage.total }} 条</span>
          </div>
        </div>

        <!-- ==================== 商家管理 ==================== -->
        <div v-else-if="activeTab === 'shops'" class="tab-content">
          <div class="section-header">
            <h3 class="section-title">商家管理</h3>
          </div>

          <!-- 搜索和筛选 -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <input
                v-model="shopKeyword"
                type="text"
                class="search-input"
                placeholder="搜索店铺名称/法人姓名..."
                @keyup.enter="searchShops"
              />
              <button class="search-btn" @click="searchShops">搜索</button>
            </div>
            <select v-model.number="shopAuditFilter" class="filter-select" @change="searchShops">
              <option :value="undefined">全部审核状态</option>
              <option :value="0">未提交</option>
              <option :value="1">审核中</option>
              <option :value="2">通过</option>
              <option :value="3">驳回</option>
            </select>
            <select v-model.number="shopStatusFilter" class="filter-select" @change="searchShops">
              <option :value="undefined">全部营业状态</option>
              <option :value="0">启用</option>
              <option :value="1">禁用</option>
              <option :value="2">注销</option>
            </select>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <!-- 表格 -->
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>店铺名称</th>
                  <th>店主</th>
                  <th>审核状态</th>
                  <th>营业状态</th>
                  <th>评分</th>
                  <th>月售</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="shop in shopList" :key="shop.id">
                  <td>{{ shop.id }}</td>
                  <td>{{ shop.name }}</td>
                  <td>{{ shop.ownerName || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="getAuditStatusClass(shop.auditStatus)">
                      {{ getAuditStatusText(shop.auditStatus) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="shop.shopStatus === 0 ? 'status-normal' : 'status-banned'">
                      {{ getShopStatusText(shop.shopStatus) }}
                    </span>
                  </td>
                  <td>{{ shop.grade || '-' }}</td>
                  <td>{{ shop.monthlySales || 0 }}</td>
                  <td>{{ shop.createTime || '-' }}</td>
                  <td class="action-cell">
                    <button class="action-btn-small" @click="viewShopDetail(shop)">详情</button>
                    <button
                      v-if="shop.auditStatus === 1"
                      class="action-btn-small primary"
                      @click="openAuditModal(shop, true)"
                    >
                      通过
                    </button>
                    <button
                      v-if="shop.auditStatus === 1"
                      class="action-btn-small danger"
                      @click="openAuditModal(shop, false)"
                    >
                      驳回
                    </button>
                    <button
                      v-if="shop.auditStatus === 2"
                      class="action-btn-small"
                      :class="shop.shopStatus === 0 ? 'danger' : 'primary'"
                      @click="toggleShopStatus(shop)"
                    >
                      {{ shop.shopStatus === 0 ? '禁用' : '启用' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="shopList.length === 0">
                  <td colspan="9" class="empty-row">暂无商家数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="shopPage.pages > 1" class="pagination">
            <button class="page-btn" :disabled="Number(shopPage.current) <= 1" @click="changeShopPage(Number(shopPage.current) - 1)">上一页</button>
            <button
              v-for="p in getPageNumbers(Number(shopPage.current), Number(shopPage.pages))"
              :key="p"
              class="page-btn"
              :class="{ active: p === Number(shopPage.current) }"
              @click="changeShopPage(p)"
            >
              {{ p }}
            </button>
            <button class="page-btn" :disabled="Number(shopPage.current) >= Number(shopPage.pages)" @click="changeShopPage(Number(shopPage.current) + 1)">下一页</button>
            <span class="page-info">共 {{ shopPage.total }} 条</span>
          </div>
        </div>

        <!-- ==================== 骑手管理 ==================== -->
        <div v-else-if="activeTab === 'delivery'" class="tab-content">
          <div class="section-header">
            <h3 class="section-title">骑手管理</h3>
          </div>

          <!-- 搜索和筛选 -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <input
                v-model="deliveryKeyword"
                type="text"
                class="search-input"
                placeholder="搜索姓名/手机号/邮箱..."
                @keyup.enter="searchDeliveries"
              />
              <button class="search-btn" @click="searchDeliveries">搜索</button>
            </div>
            <select v-model.number="deliveryStatusFilter" class="filter-select" @change="searchDeliveries">
              <option :value="undefined">全部状态</option>
              <option :value="0">正常</option>
              <option :value="1">禁用</option>
            </select>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <!-- 表格 -->
          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>邮箱</th>
                  <th>身份证号</th>
                  <th>余额</th>
                  <th>状态</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="delivery in deliveryList" :key="delivery.id">
                  <td>{{ delivery.id }}</td>
                  <td>{{ delivery.realName || '-' }}</td>
                  <td>{{ delivery.phone }}</td>
                  <td>{{ delivery.email || '-' }}</td>
                  <td>{{ delivery.idCard ? delivery.idCard.substring(0, 6) + '****' : '-' }}</td>
                  <td>¥{{ (delivery.balance || 0).toFixed(2) }}</td>
                  <td>
                    <span class="status-badge" :class="delivery.status === 0 ? 'status-normal' : 'status-banned'">
                      {{ getDeliveryStatusText(delivery.status) }}
                    </span>
                  </td>
                  <td>{{ delivery.registerTime || '-' }}</td>
                  <td class="action-cell">
                    <button
                      class="action-btn-small"
                      :class="delivery.status === 0 ? 'danger' : 'primary'"
                      @click="toggleDeliveryStatus(delivery)"
                    >
                      {{ delivery.status === 0 ? '禁用' : '启用' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="deliveryList.length === 0">
                  <td colspan="9" class="empty-row">暂无骑手数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="Number(deliveryPage.pages) > 1" class="pagination">
            <button class="page-btn" :disabled="Number(deliveryPage.current) <= 1" @click="changeDeliveryPage(Number(deliveryPage.current) - 1)">上一页</button>
            <button
              v-for="p in getPageNumbers(Number(deliveryPage.current), Number(deliveryPage.pages))"
              :key="p"
              class="page-btn"
              :class="{ active: p === Number(deliveryPage.current) }"
              @click="changeDeliveryPage(p)"
            >
              {{ p }}
            </button>
            <button class="page-btn" :disabled="Number(deliveryPage.current) >= Number(deliveryPage.pages)" @click="changeDeliveryPage(Number(deliveryPage.current) + 1)">下一页</button>
            <span class="page-info">共 {{ deliveryPage.total }} 条</span>
          </div>
        </div>
      </div>
    </main>

    <!-- ==================== 商家审核弹窗 ==================== -->
    <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ auditForm.auditStatus === 2 ? '审核通过' : '审核驳回' }}</h3>
          <button class="modal-close" @click="closeAuditModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="currentShop" class="audit-shop-info">
            <span class="info-label">店铺：</span>
            <span class="info-value">{{ currentShop.name }}</span>
          </div>
          <div v-if="auditForm.auditStatus === 3" class="form-group">
            <label class="form-label">驳回原因 *</label>
            <textarea
              v-model="auditForm.rejectReason"
              class="form-input"
              placeholder="请输入驳回原因..."
              rows="3"
            ></textarea>
          </div>
          <p v-else class="confirm-text">确认审核通过该商家吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAuditModal">取消</button>
          <button class="btn btn-primary" @click="confirmAudit">确认</button>
        </div>
      </div>
    </div>

    <!-- ==================== 商家详情弹窗 ==================== -->
    <div v-if="showShopDetailModal" class="modal-overlay" @click.self="showShopDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>商家详情</h3>
          <button class="modal-close" @click="showShopDetailModal = false">×</button>
        </div>
        <div v-if="currentShop" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">店铺名称</span>
              <span class="detail-value">{{ currentShop.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">店主</span>
              <span class="detail-value">{{ currentShop.ownerName || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系电话</span>
              <span class="detail-value">{{ currentShop.ownerPhone || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">审核状态</span>
              <span class="detail-value">{{ getAuditStatusText(currentShop.auditStatus) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">地址</span>
              <span class="detail-value">{{ [currentShop.province, currentShop.city, currentShop.district, currentShop.address].filter(Boolean).join(' ') || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">评分</span>
              <span class="detail-value">{{ currentShop.grade || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">月售数量</span>
              <span class="detail-value">{{ currentShop.monthlySales || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{ currentShop.createTime || '-' }}</span>
            </div>
            <div v-if="currentShop.description" class="detail-item full-width">
              <span class="detail-label">店铺描述</span>
              <span class="detail-value">{{ currentShop.description }}</span>
            </div>
            <div v-if="currentShop.rejectReason" class="detail-item full-width">
              <span class="detail-label">驳回原因</span>
              <span class="detail-value reject-text">{{ currentShop.rejectReason }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showShopDetailModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ==================== 用户详情弹窗 ==================== -->
    <div v-if="showUserDetailModal" class="modal-overlay" @click.self="showUserDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>用户详情</h3>
          <button class="modal-close" @click="showUserDetailModal = false">×</button>
        </div>
        <div v-if="currentUserDetail" class="modal-body">
          <!-- 基本信息 -->
          <h4 class="profile-section-title">基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">用户ID</span><span class="detail-value">{{ currentUserDetail.uid }}</span></div>
            <div class="detail-item"><span class="detail-label">用户名</span><span class="detail-value">{{ currentUserDetail.username }}</span></div>
            <div class="detail-item"><span class="detail-label">手机号</span><span class="detail-value">{{ currentUserDetail.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">邮箱</span><span class="detail-value">{{ currentUserDetail.email || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">真实姓名</span><span class="detail-value">{{ currentUserDetail.realName || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">性别</span><span class="detail-value">{{ currentUserDetail.gender === 1 ? '男' : currentUserDetail.gender === 2 ? '女' : '未知' }}</span></div>
            <div class="detail-item"><span class="detail-label">会员等级</span><span class="detail-value">{{ getMemberLevelText(currentUserDetail.memberLevel) }}</span></div>
            <div class="detail-item"><span class="detail-label">余额</span><span class="detail-value">¥{{ (currentUserDetail.balance || 0).toFixed(2) }}</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">{{ getUserStatusText(currentUserDetail.status) }}</span></div>
            <div class="detail-item"><span class="detail-label">注册时间</span><span class="detail-value">{{ currentUserDetail.registerTime || '-' }}</span></div>
            <div class="detail-item"><span class="detail-label">最后登录</span><span class="detail-value">{{ currentUserDetail.lastLoginTime || '-' }}</span></div>
          </div>

          <!-- 用户画像 -->
          <div v-if="userProfile" class="profile-section">
            <h4 class="profile-section-title">用户画像</h4>
            <!-- 概览标签 -->
            <div class="profile-tags">
              <span class="profile-tag level" :class="userProfile.consumptionLevel?.toLowerCase()">{{ getLevelText(userProfile.consumptionLevel) }}</span>
              <span class="profile-tag freq" :class="userProfile.frequencyLevel?.toLowerCase()">{{ getFreqText(userProfile.frequencyLevel) }}</span>
              <span class="profile-tag rfm">{{ userProfile.rfmSegment || '未知分群' }}</span>
              <span v-if="userProfile.userTags" class="profile-tag tag">{{ userProfile.userTags }}</span>
            </div>
            <!-- 消费统计 -->
            <h5 class="profile-sub-title">消费统计</h5>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">总订单数</span><span class="detail-value">{{ userProfile.totalOrders }}</span></div>
              <div class="detail-item"><span class="detail-label">累计消费</span><span class="detail-value">¥{{ (userProfile.totalAmount || 0).toFixed(2) }}</span></div>
              <div class="detail-item"><span class="detail-label">平均客单价</span><span class="detail-value">¥{{ (userProfile.avgOrderAmount || 0).toFixed(2) }}</span></div>
              <div class="detail-item"><span class="detail-label">最高订单</span><span class="detail-value">¥{{ (userProfile.maxOrderAmount || 0).toFixed(2) }}</span></div>
              <div class="detail-item"><span class="detail-label">月均/周均</span><span class="detail-value">{{ userProfile.monthlyOrders }} / {{ userProfile.weeklyOrders }}</span></div>
              <div class="detail-item"><span class="detail-label">距上次下单</span><span class="detail-value">{{ userProfile.daysSinceLastOrder }}天</span></div>
            </div>
            <!-- RFM 评分 -->
            <h5 class="profile-sub-title">RFM 评分</h5>
            <div class="rfm-bar">
              <div class="rfm-item"><span class="rfm-label">R 近期</span><div class="rfm-dots"><span v-for="i in 5" :key="i" class="rfm-dot" :class="{ active: i <= userProfile.recencyScore }"></span></div></div>
              <div class="rfm-item"><span class="rfm-label">F 频次</span><div class="rfm-dots"><span v-for="i in 5" :key="i" class="rfm-dot" :class="{ active: i <= userProfile.frequencyScore }"></span></div></div>
              <div class="rfm-item"><span class="rfm-label">M 金额</span><div class="rfm-dots"><span v-for="i in 5" :key="i" class="rfm-dot" :class="{ active: i <= userProfile.monetaryScore }"></span></div></div>
            </div>
            <!-- 时段偏好 -->
            <h5 class="profile-sub-title">时段偏好</h5>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">早餐</span><span class="detail-value">{{ getRatioPercent(userProfile.breakfastRatio) }}</span></div>
              <div class="detail-item"><span class="detail-label">午餐</span><span class="detail-value">{{ getRatioPercent(userProfile.lunchRatio) }}</span></div>
              <div class="detail-item"><span class="detail-label">晚餐</span><span class="detail-value">{{ getRatioPercent(userProfile.dinnerRatio) }}</span></div>
              <div class="detail-item"><span class="detail-label">夜宵</span><span class="detail-value">{{ getRatioPercent(userProfile.nightSnackRatio) }}</span></div>
              <div class="detail-item"><span class="detail-label">工作日/周末</span><span class="detail-value">{{ getRatioPercent(userProfile.weekdayRatio) }} / {{ getRatioPercent(userProfile.weekendRatio) }}</span></div>
            </div>
            <!-- 口味与行为 -->
            <h5 class="profile-sub-title">口味与行为</h5>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">辣度偏好</span><span class="detail-value">{{ getRatioPercent(userProfile.spicyPreference) }}</span></div>
              <div class="detail-item"><span class="detail-label">甜度偏好</span><span class="detail-value">{{ getRatioPercent(userProfile.sweetPreference) }}</span></div>
              <div class="detail-item"><span class="detail-label">取消率</span><span class="detail-value">{{ getRatioPercent(userProfile.cancelRate) }}</span></div>
              <div class="detail-item"><span class="detail-label">评价率</span><span class="detail-value">{{ getRatioPercent(userProfile.commentRate) }}</span></div>
              <div class="detail-item"><span class="detail-label">退款率</span><span class="detail-value">{{ getRatioPercent(userProfile.refundRate) }}</span></div>
              <div class="detail-item"><span class="detail-label">平均配送时长</span><span class="detail-value">{{ userProfile.avgDeliveryTime || 0 }}分钟</span></div>
            </div>
          </div>
          <div v-else-if="profileLoading" class="profile-loading">加载画像中...</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUserDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* ==================== 侧边栏 ==================== */
.sidebar {
  width: 260px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 36px;
}

.logo-text h2 {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.logo-text p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 4px 0 0;
}

.sidebar-nav {
  flex: 1;
  padding: 16px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 4px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: rgba(255, 255, 255, 0.6);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(255, 107, 53, 0.15);
  color: var(--primary-color);
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
}

.nav-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #e74c3c;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: rgba(231, 76, 60, 0.7);
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* ==================== 主内容区 ==================== */
.main-content {
  flex: 1;
  margin-left: 260px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
}

.avatar-icon {
  font-size: 28px;
}

.user-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.user-details p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.current-time {
  font-size: 14px;
  color: var(--text-secondary);
}

.content-area {
  padding: 32px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 统计卡片 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stats-grid.secondary {
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card.highlight {
  border: 2px solid rgba(243, 156, 18, 0.3);
  background: rgba(243, 156, 18, 0.03);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.users-icon { background: rgba(52, 152, 219, 0.1); }
.merchants-icon { background: rgba(155, 89, 182, 0.1); }
.orders-icon { background: rgba(39, 174, 96, 0.1); }
.revenue-icon { background: rgba(230, 126, 34, 0.1); }
.today-users-icon { background: rgba(26, 188, 156, 0.1); }
.today-orders-icon { background: rgba(52, 73, 94, 0.1); }
.pending-icon { background: rgba(243, 156, 18, 0.1); }

.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0; }
.stat-label { font-size: 14px; color: var(--text-muted); margin: 4px 0 0; }

/* ==================== 图表 ==================== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin: 32px 0;
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

/* ==================== 快捷操作 ==================== */
.quick-actions {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  margin-top: 32px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: #f5f7fa;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 107, 53, 0.08);
  transform: translateY(-2px);
}

.action-icon { font-size: 32px; }
.action-text { font-size: 14px; font-weight: 500; color: var(--text-secondary); }

/* ==================== 搜索栏 ==================== */
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  display: flex;
  flex: 1;
  min-width: 250px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--primary-color);
}

.search-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.search-btn:hover {
  background: var(--primary-dark);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  background: white;
  cursor: pointer;
  min-width: 140px;
}

/* ==================== 表格 ==================== */
.table-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f5f7fa;
}

.data-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  border-bottom: 1px solid var(--border-color);
}

.data-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.data-table tbody tr:hover {
  background: rgba(255, 107, 53, 0.02);
}

.empty-row {
  text-align: center;
  color: var(--text-muted);
  padding: 40px !important;
}

.action-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn-small {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: #f0f0f0;
  color: var(--text-secondary);
}

.action-btn-small:hover {
  background: #e0e0e0;
}

.action-btn-small.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn-small.primary:hover {
  background: var(--primary-dark);
}

.action-btn-small.danger {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn-small.danger:hover {
  background: rgba(231, 76, 60, 0.2);
}

/* ==================== 状态标签 ==================== */
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-normal { background: rgba(39, 174, 96, 0.1); color: #27ae60; }
.status-canceled { background: rgba(149, 165, 166, 0.1); color: #95a5a6; }
.status-banned { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }

.audit-none { background: rgba(149, 165, 166, 0.1); color: #95a5a6; }
.audit-pending { background: rgba(243, 156, 18, 0.1); color: #f39c12; }
.audit-approved { background: rgba(39, 174, 96, 0.1); color: #27ae60; }
.audit-rejected { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }

.member-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.level-1 { background: rgba(189, 195, 199, 0.15); color: #7f8c8d; }
.level-2 { background: rgba(241, 196, 15, 0.15); color: #f1c40f; }
.level-3 { background: rgba(155, 89, 182, 0.15); color: #9b59b6; }

/* ==================== 分页 ==================== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  margin-left: 12px;
  font-size: 13px;
  color: var(--text-muted);
}

/* ==================== 开发中提示 ==================== */
.dev-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.dev-icon {
  font-size: 32px;
}

.dev-text h4 {
  font-size: 15px;
  font-weight: 600;
  color: #f39c12;
  margin: 0 0 4px;
}

.dev-text p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* ==================== 弹窗 ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 40px 20px;
  overflow-y: auto;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 80px);
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
}

.modal-close:hover {
  background: var(--bg-primary);
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* ==================== 详情弹窗 ==================== */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.detail-value {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.reject-text {
  color: #e74c3c !important;
  background: rgba(231, 76, 60, 0.05);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.audit-shop-info {
  margin-bottom: 16px;
}

.info-label {
  font-size: 14px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.confirm-text {
  font-size: 15px;
  color: var(--text-secondary);
  text-align: center;
  padding: 16px 0;
}

/* ==================== 表单 ==================== */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
  resize: vertical;
}

.form-input:focus {
  border-color: var(--primary-color);
}

/* ==================== 按钮 ==================== */
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: #e8e8e8;
}

/* ==================== 加载与空状态 ==================== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-muted);
}

/* ==================== 响应式 ==================== */
/* ==================== 用户画像 ==================== */
.profile-section { margin-top: 24px; padding-top: 20px; border-top: 2px solid var(--primary-color); }
.profile-section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px; }
.profile-sub-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 1px dashed var(--border-color); }
.profile-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.profile-tag { padding: 5px 14px; border-radius: 16px; font-size: 13px; font-weight: 600; }
.profile-tag.level { background: #e8f5e9; color: #2e7d32; }
.profile-tag.level.low { background: #fafafa; color: #9e9e9e; }
.profile-tag.level.high { background: #fff3e0; color: #e65100; }
.profile-tag.level.vip { background: #fce4ec; color: #c62828; }
.profile-tag.freq { background: #e3f2fd; color: #1565c0; }
.profile-tag.rfm { background: #f3e5f5; color: #7b1fa2; }
.profile-tag.tag { background: #fff8e1; color: #f57f17; }
.rfm-bar { margin: 12px 0; }
.rfm-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.rfm-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 50px; }
.rfm-dots { display: flex; gap: 6px; }
.rfm-dot { width: 14px; height: 14px; border-radius: 50%; background: #e0e0e0; }
.rfm-dot.active { background: var(--primary-color); }
.profile-loading { text-align: center; padding: 20px; color: var(--text-muted); }

@media screen and (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
  }

  .main-content {
    margin-left: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
