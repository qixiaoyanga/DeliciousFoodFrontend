<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const orderData = ref<any>(null)
const orderId = ref<number>(0)

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
    1: '待支付',
    2: '待接单',
    3: '备货中',
    4: '配送中',
    5: '已送达',
    6: '已取消',
    7: '退款中',
    8: '已完成',
    9: '已删除'
  }
  return statusMap[status] || '未知'
}

const getPayTypeText = (type: number) => {
  const payMap: Record<number, string> = {
    1: '微信支付',
    2: '支付宝',
    3: '钱包'
  }
  return payMap[type] || '未知'
}

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    if (id) {
      orderId.value = parseInt(id)
      const orderList = await orderApi.getDetail(orderId.value)
      if (Array.isArray(orderList) && orderList.length > 0) {
        orderData.value = orderList[0]
      } else {
        toast.error('订单不存在')
        router.back()
      }
    } else {
      toast.error('订单ID不存在')
      router.back()
    }
  } catch (error: any) {
    console.error('获取订单详情失败:', error)
    toast.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const handlePay = (orderNo: number) => {
  const confirmPaymentDTO = {
    orderNo: orderNo,
    payType: orderData.value?.payMethod || 1,
    remark: '',
    address: orderData.value?.address
  }
  sessionStorage.setItem('confirmPaymentDTO', JSON.stringify(confirmPaymentDTO))
  router.push({ path: `/order/${orderNo}/pay` })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadOrderDetail()
})

onUnmounted(() => {
  sessionStorage.removeItem('fromAddressPage')
})
</script>

<template>
  <div class="order-detail-view">
    <div class="container">
      <div class="detail-header">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h1 class="detail-title">订单详情</h1>
        <div class="placeholder"></div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="orderData" class="order-content">
        <!-- 订单状态 -->
        <div class="status-card">
          <div class="status-header">
            <span class="status-icon">
              {{ orderData.status === 1 ? '⏰' : orderData.status === 2 ? '📋' : orderData.status === 3 ? '📦' : orderData.status === 4 ? '🚚' : orderData.status === 5 ? '✅' : orderData.status === 6 ? '❌' : orderData.status === 7 ? '💰' : orderData.status === 8 ? '🎉' : '🗑️' }}
            </span>
            <div class="status-info">
              <h2 class="status-title">{{ getStatusText(orderData.status) }}</h2>
              <p class="status-desc">
                {{ orderData.status === 1 ? '请尽快完成支付' :
                   orderData.status === 2 ? '商家正在等待接单' :
                   orderData.status === 3 ? '商家正在备货中' :
                   orderData.status === 4 ? '骑手正在配送中' :
                   orderData.status === 5 ? '商品已送达，请确认收货' :
                   orderData.status === 6 ? '订单已取消' :
                   orderData.status === 7 ? '退款申请处理中' :
                   orderData.status === 8 ? '订单已完成，感谢购买' : '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 收货地址 -->
        <div class="address-card">
          <div class="card-title">
            <span class="title-icon">📍</span>
            <span>收货地址</span>
          </div>
          <div class="address-content">
            <div class="address-user">
              <span class="user-name">{{ orderData.address?.consignee }}</span>
              <span class="user-phone">{{ orderData.address?.phone }}</span>
            </div>
            <p class="address-detail">{{ orderData.address?.fullAddress }}</p>
          </div>
        </div>

        <!-- 商品信息 -->
        <div class="shop-order-card">
          <div class="shop-header">
            <span class="shop-icon">🏪</span>
            <span class="shop-name">{{ orderData.shopName }}</span>
          </div>

          <div class="items-list">
            <div v-for="(item, index) in orderData.items" :key="index" class="order-item">
              <div class="item-image-wrapper">
                <img :src="getImageUrl(item.dishImage)" :alt="item.dishName" class="item-image" />
              </div>
              <div class="item-info">
                <h4 class="item-name">{{ item.dishName }}</h4>
                <div class="item-specs">
                  <span v-if="item.specName" class="spec-tag">{{ item.specName }}</span>
                  <span v-if="item.attributeDetail" class="spec-tag">{{ item.attributeDetail }}</span>
                </div>
                <div class="item-footer">
                  <span class="item-price">¥{{ item.price?.toFixed(2) }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="order-info-card">
          <div class="card-title">
            <span class="title-icon">📋</span>
            <span>订单信息</span>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">订单编号</span>
              <span class="info-value">{{ orderData.orderNo }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">下单时间</span>
              <span class="info-value">{{ orderData.createTime?.replace('T', ' ').substring(0, 19) }}</span>
            </div>
            <div class="info-row" v-if="orderData.payTime">
              <span class="info-label">支付时间</span>
              <span class="info-value">{{ orderData.payTime?.replace('T', ' ').substring(0, 19) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">支付方式</span>
              <span class="info-value">{{ getPayTypeText(orderData.payMethod) }}</span>
            </div>
            <div class="info-row" v-if="orderData.remark">
              <span class="info-label">订单备注</span>
              <span class="info-value">{{ orderData.remark }}</span>
            </div>
          </div>
        </div>

        <!-- 金额信息 -->
        <div class="payment-card">
          <div class="payment-row">
            <span class="payment-label">商品金额</span>
            <span class="payment-value">¥{{ orderData.totalAmount?.toFixed(2) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">配送费</span>
            <span class="payment-value">¥{{ orderData.deliveryFee?.toFixed(2) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">(含打包费 ¥{{ orderData.boxFee?.toFixed(2) }})</span>
            <span class="payment-value"></span>
          </div>
          <div class="payment-row" v-if="orderData.discountAmount > 0">
            <span class="payment-label">优惠</span>
            <span class="payment-value discount">-¥{{ orderData.discountAmount?.toFixed(2) }}</span>
          </div>
          <div class="payment-row total">
            <span class="payment-label">合计</span>
            <span class="payment-value">¥{{ orderData.actualAmount?.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="action-buttons" v-if="orderData.status === 1">
          <button class="pay-btn" @click="handlePay(orderData.orderNo)">
            立即支付
          </button>
        </div>
      </div>

      <div v-else class="empty-container">
        <p>订单不存在</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-view {
  min-height: calc(100vh - 100px);
  padding-bottom: 100px;
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

.loading-container,
.empty-container {
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

/* 状态卡片 */
.status-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8A65 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 12px;
  color: white;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  font-size: 48px;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.status-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

/* 地址卡片 */
.address-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.address-content {
  padding: 8px 0;
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

/* 商品卡片 */
.shop-order-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 0;
  margin-bottom: 12px;
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

.items-list {
  padding: 12px 16px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.order-item:last-child {
  padding-bottom: 0;
}

.item-image-wrapper {
  width: 70px;
  height: 70px;
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

/* 订单信息卡片 */
.order-info-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

/* 金额信息 */
.payment-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 80px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
}

.payment-label {
  color: var(--text-secondary);
}

.payment-value {
  color: var(--text-primary);
}

.payment-value.discount {
  color: #07C160;
}

.payment-row.total {
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid rgba(74, 55, 40, 0.1);
  font-weight: 600;
}

.payment-row.total .payment-value {
  font-size: 18px;
  color: var(--primary-color);
}

/* 底部操作 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.pay-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

@media screen and (max-width: 768px) {
  .order-detail-view {
    min-height: calc(100vh - 80px);
    padding-bottom: 80px;
  }
}
</style>
