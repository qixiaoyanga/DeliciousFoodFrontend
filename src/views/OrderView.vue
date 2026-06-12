<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()

interface Order {
  id: string
  shop: string
  total: number
  status: string
  time: string
  items: string[]
}

interface DeliveryInfo {
  orderNo?: string | number
  address?: string
  deliveryName?: string
  deliveryPhone?: string
  deliveryStatus?: number
  deliveryStatusText?: string
  estimatedTime?: string
  deliveryAddress?: string
  traceList?: Array<{ time: string; description: string }>
}

const activeTab = ref('all')
const isLoading = ref(true)
const orders = ref<Order[]>([])

const showDeliveryModal = ref(false)
const deliveryInfo = ref<DeliveryInfo | null>(null)
const isLoadingDelivery = ref(false)

const tabs = [
  { id: 'all', name: '全部订单' },
  { id: 'pending', name: '待支付' },
  { id: 'processing', name: '待接单' },
  { id: 'delivering', name: '配送中' },
  { id: 'refunding', name: '退款中' },
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
    const params: Record<string, number> = {}
    if (status && status !== 'all') {
      const statusMap: Record<string, number> = {
        pending: 0,
        processing: 1,
        delivering: 2,
        refunding: 4,
        completed: 3
      }
      params.status = statusMap[status] || 0
    }
    const result = await orderApi.getList(params)
    return result.map((item: any) => ({
      id: item.orderNo || item.id,
      shop: item.shopName || item.shop,
      total: item.actualAmount || item.totalAmount || item.total,
      status: String(item.status),
      payMethod: item.payMethod,
      time: item.createTime || item.time,
      items: item.items ? item.items.map((i: any) => `${i.dishName || i.name} x${i.quantity}`) : item.items,
      shopId: item.shopId
    }))
  } catch (error) {
    console.error('加载订单失败:', error)
    return []
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
  return orders.value
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
    '1': '待支付',
    '2': '待接单',
    '3': '备货中',
    '4': '配送中',
    '5': '已送达',
    '6': '已取消',
    '7': '退款中',
    '8': '已完成',
    '9': '已删除'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    '1': 'status-pending',
    '2': 'status-processing',
    '3': 'status-preparing',
    '4': 'status-delivering',
    '5': 'status-delivered',
    '6': 'status-canceled',
    '7': 'status-refunding',
    '8': 'status-completed',
    '9': 'status-deleted'
  }
  return classMap[status] || ''
}

const viewDetail = async (orderId: string) => {
  router.push({ path: `/order/detail/${orderId}` })
}

const payOrder = async (orderId: string) => {
  router.push({ path: `/order/${orderId}/pay` })
}

const cancelOrder = async (orderId: string) => {
  if (confirm('确定要取消该订单吗？')) {
    try {
      await orderApi.cancel(parseInt(orderId))
      alert('订单已取消')
      await initOrders()
    } catch (error) {
      console.error('取消订单失败:', error)
      alert('取消订单失败')
    }
  }
}

const deleteOrder = async (orderId: string) => {
  if (confirm('确定要删除该订单吗？')) {
    try {
      await orderApi.delete(parseInt(orderId))
      alert('订单已删除')
      await initOrders()
    } catch (error) {
      console.error('删除订单失败:', error)
      alert('删除订单失败')
    }
  }
}

const viewDelivery = async (orderId: string) => {
  isLoadingDelivery.value = true
  deliveryInfo.value = null
  showDeliveryModal.value = true
  try {
    const info = await orderApi.getDelivery(parseInt(orderId))
    deliveryInfo.value = info
  } catch (error) {
    console.error('查询配送信息失败:', error)
    toast.error('查询配送信息失败')
  } finally {
    isLoadingDelivery.value = false
  }
}

const closeDeliveryModal = () => {
  showDeliveryModal.value = false
  deliveryInfo.value = null
}

const getDeliveryStatusClass = (status?: number) => {
  const classMap: Record<number, string> = {
    0: 'status-pending',
    1: 'status-processing',
    2: 'status-delivering',
    3: 'status-delivered'
  }
  return status !== undefined ? classMap[status] || '' : ''
}

const parseAddress = (addressStr: string): string => {
  try {
    const address = JSON.parse(addressStr)
    return `${address.consignee || ''} ${address.phone || ''} ${address.fullAddress || ''}`.trim()
  } catch {
    return addressStr
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
            <button class="action-btn secondary" v-if="order.status !== '1'" @click="viewDetail(order.id)">查看详情</button>
            <button class="action-btn danger" v-if="order.status === '1'" @click="cancelOrder(order.id)">取消订单</button>
            <button class="action-btn danger" v-if="order.status === '5' || order.status === '8'" @click="deleteOrder(order.id)">删除订单</button>
            <button class="action-btn primary" v-if="order.status === '2' || order.status === '3' || order.status === '4'" @click="viewDelivery(order.id)">查看配送</button>
            <button class="action-btn primary" v-if="order.status === '1'" @click="payOrder(order.id)">去支付</button>
            <button class="action-btn danger" v-if="order.status === '6'" @click="deleteOrder(order.id)">删除订单</button>
            <button class="action-btn primary" v-if="order.status === '7'">查看退款</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 配送信息弹窗 -->
  <div v-if="showDeliveryModal" class="modal-overlay" @click.self="closeDeliveryModal">
    <div class="modal-content delivery-modal">
      <div class="modal-header">
        <h3>配送信息</h3>
        <button class="modal-close" @click="closeDeliveryModal">×</button>
      </div>
      <div class="modal-body">
        <div v-if="isLoadingDelivery" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="deliveryInfo">
          <div class="delivery-status">
            <div class="status-badge" :class="getDeliveryStatusClass(deliveryInfo.deliveryStatus)">
              {{ deliveryInfo.deliveryStatusText || '配送中' }}
            </div>
          </div>

          <div class="order-no" v-if="deliveryInfo.orderNo">
            <div class="info-item">
              <span class="info-label">订单编号</span>
              <span class="info-value">{{ deliveryInfo.orderNo }}</span>
            </div>
          </div>

          <div class="rider-info" v-if="deliveryInfo.deliveryName">
            <div class="info-item">
              <span class="info-label">骑手姓名</span>
              <span class="info-value">{{ deliveryInfo.deliveryName }}</span>
            </div>
            <div class="info-item" v-if="deliveryInfo.deliveryPhone">
              <span class="info-label">骑手电话</span>
              <a :href="'tel:' + deliveryInfo.deliveryPhone" class="info-value phone-link">
                {{ deliveryInfo.deliveryPhone }}
              </a>
            </div>
          </div>

          <div class="delivery-address" v-if="deliveryInfo.address">
            <div class="info-item">
              <span class="info-label">配送地址</span>
              <span class="info-value">{{ parseAddress(deliveryInfo.address) }}</span>
            </div>
          </div>

          <div class="delivery-trace" v-if="deliveryInfo.traceList && deliveryInfo.traceList.length > 0">
            <h4 class="trace-title">配送进度</h4>
            <div class="trace-list">
              <div v-for="(trace, index) in deliveryInfo.traceList" :key="index" class="trace-item">
                <div class="trace-dot" :class="{ active: index === 0 }"></div>
                <div class="trace-content">
                  <p class="trace-description">{{ trace.description }}</p>
                  <p class="trace-time">{{ trace.time }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无配送信息</p>
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

.status-preparing {
  background: rgba(52, 152, 219, 0.15);
  color: #3498db;
}

.status-delivering {
  background: rgba(155, 89, 182, 0.15);
  color: #9b59b6;
}

.status-delivered {
  background: rgba(230, 126, 34, 0.15);
  color: #e67e22;
}

.status-canceled {
  background: rgba(149, 165, 166, 0.15);
  color: #95a5a6;
}

.status-refunding {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.status-deleted {
  background: rgba(200, 200, 200, 0.15);
  color: #999;
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

.action-btn.danger {
  background: #e74c3c;
  color: white;
}

.action-btn.danger:hover {
  background: #c0392b;
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

/* 配送信息弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(74, 55, 40, 0.1);
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
  background: rgba(74, 55, 40, 0.05);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(74, 55, 40, 0.1);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.delivery-modal .modal-body {
  min-height: 200px;
}

.delivery-status {
  text-align: center;
  margin-bottom: 24px;
}

.status-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status-badge.status-pending {
  background: rgba(255, 217, 61, 0.2);
  color: #d4a200;
}

.status-badge.status-processing {
  background: rgba(255, 107, 53, 0.15);
  color: var(--primary-color);
}

.status-badge.status-delivering {
  background: rgba(155, 89, 182, 0.15);
  color: #9b59b6;
}

.status-badge.status-delivered {
  background: rgba(39, 174, 96, 0.15);
  color: #27ae60;
}

.estimated-time {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.rider-info,
.delivery-address {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px dashed rgba(74, 55, 40, 0.1);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.phone-link {
  color: var(--primary-color);
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.delivery-trace {
  margin-top: 24px;
}

.trace-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.trace-list {
  position: relative;
  padding-left: 24px;
}

.trace-list::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: rgba(74, 55, 40, 0.1);
}

.trace-item {
  position: relative;
  padding-bottom: 20px;
}

.trace-item:last-child {
  padding-bottom: 0;
}

.trace-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(74, 55, 40, 0.2);
  border: 3px solid white;
  box-shadow: 0 0 0 2px rgba(74, 55, 40, 0.1);
}

.trace-dot.active {
  background: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
}

.trace-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trace-description {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

.trace-time {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state .loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-state p {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}
</style>
