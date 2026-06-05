<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const confirming = ref(false)
const payData = ref<any>(null)
const orderNo = ref(0)

const getPayTypeText = (type: number) => {
  const payMap: Record<number, string> = {
    1: '微信支付',
    2: '支付宝',
    3: '钱包'
  }
  return payMap[type] || '未知'
}

const getPayTypeIcon = (type: number) => {
  if (type === 1) {
    return `<svg viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="11" fill="#07C160"/><path d="M9.5 15.5C9.5 15.5 7 13.5 7 11C7 9 9.5 7 12 7C14.5 7 17 9 17 11C17 13.5 14.5 15.5 14.5 15.5" fill="#07C160"/><circle cx="9" cy="10" r="1.5" fill="white"/><circle cx="15" cy="10" r="1.5" fill="white"/><path d="M12 16C13 16.5 14 17 14.5 17.5C14 17 13 16.5 12 16Z" fill="white"/></svg>`
  } else if (type === 2) {
    return `<svg viewBox="0 0 24 24" width="32" height="32"><rect x="2" y="4" width="20" height="16" rx="2" fill="#1677FF"/><path d="M7 12L10 15L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  } else {
    return `<svg viewBox="0 0 24 24" width="32" height="32"><rect x="3" y="6" width="18" height="14" rx="2" fill="#FF6B35"/><circle cx="12" cy="13" r="4" fill="white"/><path d="M10 13C10 14.1046 10.8954 15 12 15C13.1046 15 14 14.1046 14 13" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round"/></svg>`
  }
}

// 解析地址JSON
const addressInfo = computed(() => {
  if (!payData.value?.address) return null
  try {
    if (typeof payData.value.address === 'string') {
      return JSON.parse(payData.value.address)
    }
    return payData.value.address
  } catch (e) {
    console.error('解析地址失败:', e)
    return null
  }
})

const loadPayData = () => {
  const payDataParam = route.query.payData as string
  const orderNoParam = route.query.orderNo as string
  
  if (!payDataParam) {
    toast.error('支付数据不存在')
    router.back()
    return
  }

  try {
    payData.value = JSON.parse(payDataParam)
    orderNo.value = parseInt(orderNoParam || payData.value.orderNo)
    console.log('支付数据:', payData.value)
  } catch (error: any) {
    console.error('解析支付数据失败:', error)
    toast.error('支付数据解析失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 确认支付
const confirmPay = async () => {
  if (confirming.value) return
  
  confirming.value = true
  try {
    // 这里可以调用实际的支付确认接口
    // await orderApi.confirmPay(orderNo.value)
    
    toast.success('支付成功')
    
    // 跳转到订单详情
    setTimeout(() => {
      router.replace({ path: '/order/detail', query: { orderNo: orderNo.value.toString() } })
    }, 1000)
  } catch (error: any) {
    console.error('支付确认失败:', error)
    toast.error('支付确认失败')
  } finally {
    confirming.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadPayData()
})
</script>

<template>
  <div class="payment-confirm-view">
    <div class="container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="payData" class="payment-content">
        <div class="detail-header">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
          </button>
          <h1 class="detail-title">确认支付</h1>
          <div class="placeholder"></div>
        </div>

        <!-- 订单信息 -->
        <div class="info-card">
          <div class="card-title">
            <span class="title-icon">📋</span>
            <span>订单信息</span>
          </div>
          <div class="info-content">
            <div class="info-row">
              <span class="info-label">订单编号</span>
              <span class="info-value">{{ payData.orderNo }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">用户ID</span>
              <span class="info-value">{{ payData.userId }}</span>
            </div>
          </div>
        </div>

        <!-- 收货地址 -->
        <div class="info-card">
          <div class="card-title">
            <span class="title-icon">📍</span>
            <span>收货地址</span>
          </div>
          <div v-if="addressInfo" class="address-content">
            <div class="address-user">
              <span class="user-name">{{ addressInfo.consignee }}</span>
              <span class="user-phone">{{ addressInfo.phone }}</span>
            </div>
            <p class="address-detail">{{ addressInfo.fullAddress }}</p>
            <div v-if="addressInfo.longitude && addressInfo.latitude" class="address-location">
              <span class="location-text">📍 经度: {{ addressInfo.longitude.toFixed(6) }}, 纬度: {{ addressInfo.latitude.toFixed(6) }}</span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>暂无地址信息</p>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="info-card">
          <div class="card-title">
            <span class="title-icon">💳</span>
            <span>支付方式</span>
          </div>
          <div class="pay-method-content">
            <div class="pay-method-icon" v-html="getPayTypeIcon(payData.payMethod)"></div>
            <span class="pay-method-name">{{ getPayTypeText(payData.payMethod) }}</span>
          </div>
        </div>

        <!-- 备注信息 -->
        <div class="info-card">
          <div class="card-title">
            <span class="title-icon">📝</span>
            <span>备注信息</span>
          </div>
          <div class="remark-content">
            <p v-if="payData.remark">{{ payData.remark }}</p>
            <p v-else class="no-remark">无备注</p>
          </div>
        </div>

        <!-- 支付金额 -->
        <div class="amount-card">
          <div class="card-title">
            <span class="title-icon">💰</span>
            <span>支付金额</span>
          </div>
          <div class="amount-content">
            <span class="amount-label">实付金额</span>
            <span class="amount-value">¥{{ payData.actualAmount?.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 确认支付按钮 -->
        <div class="action-buttons">
          <button
            class="confirm-btn"
            :class="{ disabled: confirming }"
            :disabled="confirming"
            @click="confirmPay"
          >
            {{ confirming ? '支付中...' : `确认支付 ¥${payData.actualAmount?.toFixed(2)}` }}
          </button>
        </div>
      </div>

      <div v-else class="error-container">
        <div class="error-icon">❌</div>
        <h3 class="error-title">支付数据加载失败</h3>
        <button class="go-back-btn" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-confirm-view {
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

.loading-container,
.error-container {
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

.error-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.error-title {
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

.info-card,
.amount-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.info-content {
  padding-left: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.address-content {
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
  margin: 0 0 8px 0;
}

.address-location {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(74, 55, 40, 0.1);
}

.location-text {
  font-size: 12px;
  color: var(--text-muted);
}

.no-data p {
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  margin: 0;
}

.pay-method-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.pay-method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-method-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.remark-content {
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.remark-content p {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

.no-remark {
  color: var(--text-muted) !important;
}

.amount-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 12px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 217, 61, 0.05) 100%);
  border-radius: var(--radius-md);
}

.amount-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.confirm-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.confirm-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media screen and (max-width: 768px) {
  .payment-confirm-view {
    min-height: calc(100vh - 80px);
    padding-bottom: 100px;
  }

  .amount-value {
    font-size: 28px;
  }
}
</style>
