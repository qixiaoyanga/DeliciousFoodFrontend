<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi, cartApi } from '@/api'
import { useCart } from '@/store/cart'
import { toast } from '@/utils/toast'
import type { CartItem } from '@/types'

const router = useRouter()
const route = useRoute()

const cart = useCart()
const orderId = ref(0)
const loading = ref(true)
const creatingOrder = ref(false)
const orders = ref<any[]>([])

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/80x80?text=No+Image'
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
}

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待支付',
    1: '待接单',
    2: '待配送',
    3: '配送中',
    4: '已完成',
    5: '已取消'
  }
  return statusMap[status] || '未知'
}

const getPayTypeText = (payType: number) => {
  const payMap: Record<number, string> = {
    1: '微信支付',
    2: '支付宝',
    3: '钱包'
  }
  return payMap[payType] || '未知'
}

interface Address {
  id: number
  name: string
  phone: string
  address: string
  isDefault: boolean
}

const addresses = ref<Address[]>([
  { id: 1, name: '张三', phone: '138****8888', address: '北京市朝阳区建国路88号SOHO现代城A座1201', isDefault: true },
  { id: 2, name: '李四', phone: '139****9999', address: '北京市海淀区中关村大街1号科技大厦5层', isDefault: false },
  { id: 3, name: '王五', phone: '137****7777', address: '北京市西城区金融街8号国际大厦B座802', isDefault: false }
])

const selectedAddressId = ref(0)
const remark = ref('')
const payType = ref(1)
const selectedCartIds = ref<number[]>([])

const totalAmount = computed(() => {
  return orders.value.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
})

const totalDeliveryFee = computed(() => {
  return orders.value.reduce((sum, order) => sum + (order.deliveryFee || 0), 0)
})

const totalBoxFee = computed(() => {
  return orders.value.reduce((sum, order) => sum + (order.boxFee || 0), 0)
})

const totalDiscount = computed(() => {
  return orders.value.reduce((sum, order) => sum + (order.discountAmount || 0), 0)
})

const actualTotal = computed(() => {
  return orders.value.reduce((sum, order) => sum + (order.actualAmount || 0), 0)
})

const orderNo = computed(() => {
  return orders.value[0]?.orderNo || ''
})

const createOrder = async () => {
  creatingOrder.value = true
  try {
    const orderData = {
      cartIds: selectedCartIds.value,
      remark: remark.value,
      payType: payType.value
    }

    const result = await orderApi.create(orderData)

    if (result.orders && result.orders.length > 0) {
      orders.value = result.orders
      orderId.value = result.orders[0].orderNo
    } else {
      throw new Error('订单创建失败')
    }
  } catch (error: any) {
    toast.error('创建订单失败: ' + (error.message || '未知错误'))
  } finally {
    creatingOrder.value = false
    loading.value = false
  }
}

const selectAddress = () => {
  if (orderId.value) {
    router.push({ path: '/address', query: { select: 'true', orderNo: orderId.value } })
  } else {
    router.push({ path: '/address', query: { select: 'true' } })
  }
}

onMounted(async () => {
  const orderNoParam = route.query.orderNo as string

  if (orderNoParam) {
    orderId.value = parseInt(orderNoParam)
    try {
      const data = await orderApi.getDetail(orderId.value)
      if (Array.isArray(data)) {
        orders.value = data
      } else if (data.orders) {
        orders.value = data.orders
      } else {
        orders.value = [data]
      }
    } catch (error: any) {
      console.error('获取订单详情失败:', error)
    } finally {
      loading.value = false
    }
  } else {
    const path = route.path
    const match = path.match(/\/order\/detail\/(\d+)/)

    if (match) {
      orderId.value = parseInt(match[1])
      try {
        const data = await orderApi.getDetail(orderId.value)
        if (Array.isArray(data)) {
          orders.value = data
        } else if (data.orders) {
          orders.value = data.orders
        } else {
          orders.value = [data]
        }
      } catch (error: any) {
        console.error('获取订单详情失败:', error)
      } finally {
        loading.value = false
      }
    } else {
      const cartIdsParam = route.query.cartIds as string
      if (cartIdsParam) {
        selectedCartIds.value = cartIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      }

      try {
        const cartData = await cartApi.get()
        cart.setItems(cartData)
      } catch (error: any) {
        console.error('获取购物车数据失败:', error)
      }

      const selectedAddrStr = sessionStorage.getItem('selectedAddress')
      if (selectedAddrStr) {
        const selectedAddr = JSON.parse(selectedAddrStr)
        selectedAddressId.value = selectedAddr.id
        sessionStorage.removeItem('selectedAddress')
      }

      await createOrder()
    }
  }
})

const handleCancel = async (orderNo: number) => {
  if (!confirm('确定要取消订单吗？')) return

  try {
    await orderApi.cancel(orderNo)
    const order = orders.value.find(o => o.orderNo === orderNo)
    if (order) {
      order.status = 5
    }
    toast.success('订单已取消')
  } catch (error: any) {
    console.error('取消订单失败:', error)
    toast.error('取消订单失败')
  }
}

const handlePay = async (orderNo: number) => {
  // 检查是否有地址
  if (!orders.value[0].address) {
    toast.error('请先选择收货地址')
    return
  }
  
  try {
    const result = await orderApi.pay({
      orderNo: orderNo,
      payType: payType.value,
      address: orders.value[0].address,
      remark: remark.value
    })
    
    // 跳转到支付确认页面，传递支付数据
    router.push({ 
      path: '/payment/confirm', 
      query: { 
        orderNo: orderNo.toString(),
        payData: JSON.stringify(result.data || result)
      } 
    })
  } catch (error: any) {
    console.error('提交支付信息失败:', error)
    toast.error('提交支付信息失败')
  }
}

const handleConfirm = async (orderNo: number) => {
  if (!confirm('确认已收到商品？')) return

  try {
    await orderApi.confirm(orderNo)
    const order = orders.value.find(o => o.orderNo === orderNo)
    if (order) {
      order.status = 4
    }
    toast.success('确认收货成功')
  } catch (error: any) {
    console.error('确认收货失败:', error)
    toast.error('确认收货失败')
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="order-detail-view">
    <div class="container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>{{ creatingOrder ? '正在创建订单...' : '正在加载...' }}</p>
      </div>

      <div v-else-if="orders.length === 0" class="empty-container">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">没有找到订单</h3>
        <button class="go-back-btn" @click="goBack">返回</button>
      </div>

      <div v-else>
        <div class="detail-header">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
          </button>
          <h1 class="detail-title">订单详情</h1>
          <div class="placeholder"></div>
        </div>

        <div class="order-status-card">
          <div class="status-row">
            <span class="status-label">订单状态</span>
            <span class="status-value" :class="'status-' + orders[0].status">{{ getStatusText(orders[0].status) }}</span>
          </div>
          <div class="order-id-row">
            <span class="order-id-label">订单编号</span>
            <span class="order-id-value">{{ orderNo }}</span>
          </div>
        </div>

        <div class="address-section">
          <div class="card-title">
            <span class="title-icon">📍</span>
            <span>收货地址</span>
            <button v-if="orders[0].status === 0" class="edit-btn" @click="selectAddress">选择地址</button>
          </div>
          <div v-if="orders[0].address && orders[0].address.fullAddress" class="address-card-static">
            <div class="address-user">
              <span class="user-name">{{ orders[0].address.consignee }}</span>
              <span class="user-phone">{{ orders[0].address.phone }}</span>
            </div>
            <p class="address-detail">{{ orders[0].address.fullAddress }}</p>
          </div>
          <div v-else class="no-address">
            <p class="no-address-text">请选择收货地址</p>
            <button class="select-address-btn" @click="selectAddress">选择地址</button>
          </div>
        </div>

        <div v-for="(order, orderIndex) in orders" :key="order.shopId" class="shop-order-card">
          <div class="shop-header">
            <span class="shop-icon">🏪</span>
            <span class="shop-name">{{ order.shopName }}</span>
            <span class="shop-fee">配送费: ¥{{ order.deliveryFee?.toFixed(2) }} 打包费: ¥{{ order.boxFee?.toFixed(2) }}</span>
          </div>

          <div class="items-list">
            <div
              v-for="(item, index) in order.items"
              :key="index"
              class="order-item"
            >
              <div class="item-image-wrapper">
                <img :src="getImageUrl(item.dishImage)" :alt="item.dishName" class="item-image" />
              </div>
              <div class="item-info">
                <h4 class="item-name">{{ item.dishName }}</h4>
                <div class="item-specs">
                  <span v-if="item.specName" class="spec-tag">{{ item.specName }}</span>
                  <template v-if="item.attributeDetail">
                    <span
                      v-for="(attr, idx) in item.attributeDetail.split(',')"
                      :key="idx"
                      class="attr-tag"
                    >
                      {{ attr.trim() }}
                    </span>
                  </template>
                </div>
                <div class="item-footer">
                  <span class="item-price">¥{{ item.amount?.toFixed(2) || item.price?.toFixed(2) }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="shop-summary">
            <span class="shop-total">小计: ¥{{ order.actualAmount?.toFixed(2) }}</span>
          </div>
        </div>

        <div class="remark-section">
          <div class="card-title">
            <span class="title-icon">📝</span>
            <span>订单备注</span>
          </div>
          <div v-if="orders[0].status !== 0" class="remark-static">
            <p>{{ orders[0].remark || '无备注' }}</p>
          </div>
          <div v-else>
            <textarea
              class="remark-input"
              placeholder="如有特殊要求，请在此备注..."
              rows="3"
              v-model="remark"
            ></textarea>
          </div>
        </div>

        <div class="pay-section">
          <div class="card-title">
            <span class="title-icon">💳</span>
            <span>支付方式</span>
          </div>
          <div v-if="orders[0].status !== 0" class="pay-static">
            <span class="pay-type-text">{{ getPayTypeText(orders[0].payMethod) }}</span>
          </div>
          <div v-else class="pay-options">
            <label class="pay-option">
              <input type="radio" name="payType" :value="1" v-model="payType" />
              <svg class="pay-icon-svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" fill="#07C160"/>
                <path d="M9.5 15.5C9.5 15.5 7 13.5 7 11C7 9 9.5 7 12 7C14.5 7 17 9 17 11C17 13.5 14.5 15.5 14.5 15.5" fill="#07C160"/>
                <circle cx="9" cy="10" r="1.5" fill="white"/>
                <circle cx="15" cy="10" r="1.5" fill="white"/>
                <path d="M12 16C13 16.5 14 17 14.5 17.5C14 17 13 16.5 12 16Z" fill="white"/>
              </svg>
              <span class="pay-name">微信支付</span>
            </label>
            <label class="pay-option">
              <input type="radio" name="payType" :value="2" v-model="payType" />
              <svg class="pay-icon-svg" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#1677FF"/>
                <path d="M7 12L10 15L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              <span class="pay-name">支付宝</span>
            </label>
            <label class="pay-option">
              <input type="radio" name="payType" :value="3" v-model="payType" />
              <svg class="pay-icon-svg" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="14" rx="2" fill="#FF6B35"/>
                <circle cx="12" cy="13" r="4" fill="white"/>
                <path d="M10 13C10 14.1046 10.8954 15 12 15C13.1046 15 14 14.1046 14 13" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="pay-name">钱包</span>
            </label>
          </div>
        </div>

        <div class="payment-card">
          <div class="card-title">
            <span class="title-icon">💰</span>
            <span>支付信息</span>
          </div>
          <div class="payment-info">
            <div class="payment-row">
              <span class="payment-label">商品金额</span>
              <span class="payment-value">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">配送费</span>
              <span class="payment-value">¥{{ totalDeliveryFee.toFixed(2) }}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">打包费</span>
              <span class="payment-value">¥{{ totalBoxFee.toFixed(2) }}</span>
            </div>
            <div v-if="totalDiscount > 0" class="payment-row">
              <span class="payment-label">优惠金额</span>
              <span class="payment-value discount">-¥{{ totalDiscount.toFixed(2) }}</span>
            </div>
            <div class="payment-row total">
              <span class="payment-label">实付金额</span>
              <span class="payment-value">¥{{ actualTotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="time-card">
          <div class="card-title">
            <span class="title-icon">⏰</span>
            <span>时间信息</span>
          </div>
          <div class="time-info">
            <div class="time-row">
              <span class="time-label">下单时间</span>
              <span class="time-value">{{ orders[0].createTime?.replace('T', ' ').slice(0, 19) }}</span>
            </div>
            <div class="time-row" v-if="orders[0].updateTime">
              <span class="time-label">更新时间</span>
              <span class="time-value">{{ orders[0].updateTime?.replace('T', ' ').slice(0, 19) }}</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button
            v-if="orders[0].status === 0"
            class="action-btn primary"
            @click="handlePay(orderNo)"
          >
            立即支付
          </button>
          <button
            v-if="orders[0].status === 0"
            class="action-btn cancel"
            @click="handleCancel(orderNo)"
          >
            取消订单
          </button>
          <button
            v-if="orders[0].status === 3"
            class="action-btn primary"
            @click="handleConfirm(orderNo)"
          >
            确认收货
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-view {
  min-height: calc(100vh - 100px);
  padding-bottom: 120px;
  background: var(--bg-secondary);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  margin: 0 -20px 16px -20px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 55, 40, 0.05);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  color: var(--text-primary);
}

.back-icon {
  font-weight: bold;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.placeholder {
  width: 40px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-container {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.go-back-btn {
  padding: 12px 32px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.order-status-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.status-row,
.order-id-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-row {
  margin-bottom: 8px;
}

.status-label,
.order-id-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.status-value {
  font-size: 16px;
  font-weight: 600;
}

.status-0 {
  color: var(--primary-color);
}

.status-1 {
  color: #f59e0b;
}

.status-2 {
  color: #3b82f6;
}

.status-3 {
  color: #10b981;
}

.status-4 {
  color: var(--text-muted);
}

.status-5 {
  color: #ef4444;
}

.order-id-value {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: monospace;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 18px;
}

.card-title span:last-child {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-btn {
  margin-left: auto;
  padding: 6px 12px;
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.address-section,
.shop-order-card,
.items-card,
.remark-section,
.pay-section,
.payment-card,
.time-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.address-card-static {
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.address-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-phone {
  font-size: 14px;
  color: var(--text-secondary);
}

.address-detail {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.no-address {
  text-align: center;
  padding: 24px 16px;
}

.no-address-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.select-address-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.shop-order-card {
  padding: 0;
  overflow: hidden;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(74, 55, 40, 0.03);
  border-bottom: 1px solid rgba(74, 55, 40, 0.08);
}

.shop-icon {
  font-size: 18px;
}

.shop-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.shop-fee {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
}

.items-list {
  padding: 12px 16px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(74, 55, 40, 0.08);
}

.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-image-wrapper {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.spec-tag {
  padding: 2px 8px;
  background: rgba(74, 55, 40, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  border-radius: 4px;
}

.attr-tag {
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  font-size: 12px;
  border-radius: 4px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.item-quantity {
  font-size: 14px;
  color: var(--text-secondary);
}

.shop-summary {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  background: rgba(74, 55, 40, 0.03);
}

.shop-total {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.remark-static p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(74, 55, 40, 0.15);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  resize: none;
  box-sizing: border-box;
}

.remark-input::placeholder {
  color: var(--text-muted);
}

.pay-static {
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.pay-type-text {
  font-size: 14px;
  color: var(--text-primary);
}

.pay-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.pay-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.pay-option:hover {
  border-color: rgba(255, 107, 53, 0.2);
}

.pay-option input {
  width: 18px;
  height: 18px;
}

.pay-option:has(input:checked) {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.03);
}

.pay-icon-svg {
  width: 24px;
  height: 24px;
}

.pay-name {
  font-size: 14px;
  color: var(--text-primary);
}

.payment-info {
  padding-left: 8px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.payment-label {
  color: var(--text-secondary);
}

.payment-value {
  color: var(--text-primary);
}

.payment-value.discount {
  color: #10b981;
}

.payment-row.total {
  font-weight: 600;
  font-size: 16px;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid rgba(74, 55, 40, 0.08);
}

.payment-row.total .payment-value {
  color: var(--primary-color);
  font-size: 18px;
}

.time-info {
  padding-left: 8px;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.time-label {
  color: var(--text-secondary);
}

.time-value {
  color: var(--text-primary);
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
}

.action-btn.cancel {
  background: rgba(74, 55, 40, 0.08);
  color: var(--text-primary);
}

@media screen and (max-width: 768px) {
  .order-detail-view {
    min-height: calc(100vh - 80px);
    padding-bottom: 100px;
  }

  .pay-options {
    gap: 12px;
  }

  .pay-option {
    padding: 10px 12px;
  }
}
</style>
