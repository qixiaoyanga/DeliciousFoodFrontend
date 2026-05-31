<script setup lang="ts">
import { ref, computed } from 'vue'
import { orderApi } from '@/api'

interface Order {
  id: string
  shop: string
  total: number
  status: string
  time: string
  items: string[]
}

const activeTab = ref('all')
const isLoading = ref(true)
const orders = ref<Order[]>([])

const tabs = [
  { id: 'all', name: '全部订单' },
  { id: 'pending', name: '待支付' },
  { id: 'processing', name: '进行中' },
  { id: 'completed', name: '已完成' }
]

const mockOrders: Order[] = [
  {
    id: 'ORDER20240531001',
    shop: '老北京炸酱面馆',
    total: 45.5,
    status: 'completed',
    time: '2024-05-30 18:30',
    items: ['招牌炸酱面 x2', '豆浆 x1']
  },
  {
    id: 'ORDER20240531002',
    shop: '麦乐汉堡',
    total: 68.0,
    status: 'processing',
    time: '2024-05-31 12:15',
    items: ['牛肉汉堡套餐 x2', '薯条 x1']
  }
]

const loadOrders = async (status?: string): Promise<Order[]> => {
  try {
    const params: Record<string, number> = { page: 1, pageSize: 20 }
    if (status && status !== 'all') {
      const statusMap: Record<string, number> = {
        pending: 0,
        processing: 1,
        completed: 2
      }
      params.status = statusMap[status] || 0
    }
    const result = await orderApi.getList(params)
    return result.list.map((item: any) => ({
      id: item.orderNo || item.id,
      shop: item.shopName || item.shop,
      total: item.totalAmount || item.total,
      status: item.status === 0 ? 'pending' : item.status === 1 ? 'processing' : 'completed',
      time: item.createTime || item.time,
      items: item.items ? item.items.map((i: any) => `${i.name} x${i.quantity}`) : item.items
    }))
  } catch (error) {
    console.error('加载订单失败:', error)
    if (status && status !== 'all') {
      return mockOrders.filter(o => o.status === status)
    }
    return mockOrders
  }
}

const initOrders = async () => {
  isLoading.value = true
  try {
    orders.value = await loadOrders()
  } catch (error) {
    console.error('初始化订单失败:', error)
  } finally {
    isLoading.value = false
  }
}

initOrders()

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return orders.value
  }
  return orders.value.filter(order => order.status === activeTab.value)
})

const handleTabChange = async (tabId: string) => {
  activeTab.value = tabId
  isLoading.value = true
  try {
    orders.value = await loadOrders(tabId)
  } catch (error) {
    console.error('切换订单状态失败:', error)
  } finally {
    isLoading.value = false
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    processing: '配送中',
    completed: '已完成'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed'
  }
  return classMap[status] || ''
}

const viewDetail = async (orderId: string) => {
  try {
    const detail = await orderApi.getDetail(parseInt(orderId.replace('ORDER', '')))
    console.log('订单详情:', detail)
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const payOrder = async (orderId: string) => {
  try {
    const result = await orderApi.pay(parseInt(orderId.replace('ORDER', '')))
    console.log('支付结果:', result)
  } catch (error) {
    console.error('支付失败:', error)
  }
}
</script>

<template>
  <div class="order-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">我的订单</h1>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="handleTabChange(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="orders-list">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p class="empty-text">暂无订单</p>
          <button class="browse-btn" @click="$router.push('/')">
            去逛逛
          </button>
        </div>

        <div v-else class="order-card" v-for="order in filteredOrders" :key="order.id">
          <div class="order-header">
            <div class="order-shop">
              <span class="shop-icon">🏪</span>
              <span class="shop-name">{{ order.shop }}</span>
            </div>
            <span class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="order-items">
            <p v-for="(item, index) in order.items" :key="index" class="item-text">
              {{ item }}
            </p>
          </div>

          <div class="order-footer">
            <div class="order-info">
              <span class="order-id">订单号：{{ order.id }}</span>
              <span class="order-time">{{ order.time }}</span>
            </div>
            <div class="order-total">
              <span class="total-label">实付</span>
              <span class="total-value">¥{{ order.total.toFixed(1) }}</span>
            </div>
          </div>

          <div class="order-actions">
            <button class="action-btn secondary" @click="viewDetail(order.id)">查看详情</button>
            <button class="action-btn primary" v-if="order.status === 'completed'">
             再来一单
            </button>
            <button class="action-btn primary" v-else-if="order.status === 'processing'">
             查看配送
            </button>
            <button class="action-btn primary" v-else @click="payOrder(order.id)">
              去支付
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-page {
  min-height: calc(100vh - 200px);
  padding: 40px 0;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  border-bottom: 2px solid rgba(74, 55, 40, 0.1);
  padding-bottom: 16px;
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--primary-color);
  background: rgba(255, 107, 53, 0.08);
}

.tab-btn.active {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.08);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.browse-btn {
  padding: 12px 32px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.browse-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.order-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.order-card:hover {
  box-shadow: var(--shadow-md);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(74, 55, 40, 0.1);
}

.order-shop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-icon {
  font-size: 20px;
}

.shop-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.order-status {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
}

.status-pending {
  background: rgba(255, 217, 61, 0.2);
  color: #d4a200;
}

.status-processing {
  background: rgba(255, 107, 53, 0.15);
  color: var(--primary-color);
}

.status-completed {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.order-items {
  margin-bottom: 16px;
}

.item-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  line-height: 1.5;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px dashed rgba(74, 55, 40, 0.1);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-id {
  font-size: 13px;
  color: var(--text-muted);
}

.order-time {
  font-size: 12px;
  color: var(--text-muted);
}

.order-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-label {
  font-size: 12px;
  color: var(--text-muted);
}

.total-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-color);
}

.order-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.action-btn.secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(74, 55, 40, 0.2);
}

.action-btn.secondary:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

@media screen and (max-width: 768px) {
  .page-title {
    font-size: 26px;
  }

  .tabs {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .order-card {
    padding: 16px;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .order-total {
    align-items: flex-start;
  }

  .order-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>