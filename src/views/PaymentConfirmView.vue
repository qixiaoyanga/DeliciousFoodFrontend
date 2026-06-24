<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const confirming = ref(false)
const payData = ref<any>(null)
const orderNo = ref(0)

const showWalletModal = ref(false)
const walletPassword = ref('')

const payType = ref(1)
const remark = ref('')
const address = ref<any>(null)

interface AddressInfo {
  id: number
  consignee: string
  phone: string
  province?: string
  city?: string
  district?: string
  detail: string
  fullAddress: string
  defaulted?: number
}

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

const addressInfo = computed(() => {
  if (address.value) {
    return address.value
  }
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

const loadPayData = async () => {
  const orderNoParam = route.query.orderNo as string
  const orderIdParam = route.params.id as string

  const orderNoStr = orderNoParam || orderIdParam

  if (orderNoStr) {
    orderNo.value = parseInt(orderNoStr)

    const dtoStr = sessionStorage.getItem('confirmPaymentDTO')
    if (dtoStr) {
      try {
        const dto = JSON.parse(dtoStr)
        if (dto.payType) {
          payType.value = dto.payType
        }
        if (dto.remark) {
          remark.value = dto.remark
        }
        if (dto.address) {
          address.value = dto.address as AddressInfo
          console.log('从sessionStorage获取地址:', address.value)
        }
        sessionStorage.removeItem('confirmPaymentDTO')
      } catch (e) {
        console.error('解析confirmPaymentDTO失败:', e)
      }
    }

    try {
      const orders = await orderApi.getDetail(orderNo.value)
      if (Array.isArray(orders) && orders.length > 0) {
        payData.value = orders[0]
        if (!payType.value && payData.value.payMethod) {
          payType.value = payData.value.payMethod
        }
        if (!remark.value && payData.value.remark) {
          remark.value = payData.value.remark
        }
        console.log('从后端获取支付数据:', payData.value)
      } else {
        toast.error('订单不存在')
        router.back()
      }
    } catch (error: any) {
      console.error('获取订单信息失败:', error)
      toast.error('获取订单信息失败')
      router.back()
    } finally {
      loading.value = false
    }
  } else {
    toast.error('订单编号不存在')
    router.back()
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

let pollTimer: number | null = null
let hasNavigated = false

const checkPayStatus = async () => {
  if (hasNavigated) return

  try {
    const orders = await orderApi.getDetail(orderNo.value)
    if (Array.isArray(orders) && orders.length > 0) {
      const order = orders[0]
      if (order.status === 2 || order.status === 8) {
        hasNavigated = true
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        toast.success('支付成功')
        router.replace({ path: '/payment/success', query: { orderNo: orderNo.value.toString() } })
      }
    }
  } catch (error) {
    console.error('检查支付状态失败:', error)
  }
}

const handleWechatPay = async () => {
  try {
    await orderApi.wechatPay(orderNo.value)
    router.replace({ path: '/payment/success', query: { orderNo: orderNo.value.toString(), payMethod: '1' } })
  } catch (error: any) {
    console.error('微信支付失败:', error)
    toast.error(error.message || '支付失败')
  }
}

const handleAlipayPay = async () => {
  try {
    const html = await orderApi.alipayPay(orderNo.value)

    const payWindow = window.open('', '_blank')
    if (payWindow) {
      const cleanHtml = html.replace(/[\r\n]+/g, '').trim()
      payWindow.document.write(cleanHtml)
      payWindow.document.close()

      pollTimer = window.setInterval(checkPayStatus, 3000)
      toast.info('正在等待支付，请在新窗口完成支付')
    } else {
      toast.error('无法打开新窗口，请检查浏览器设置')
    }
  } catch (error: any) {
    console.error('支付宝支付失败:', error)
    toast.error(error.message || '支付宝支付失败')
  }
}

const handleWalletPay = async (password: string) => {
  if (!password.trim()) {
    toast.error('请输入支付密码')
    return
  }

  try {
    await orderApi.walletPay({ orderNo: orderNo.value, password })
    showWalletModal.value = false
    walletPassword.value = ''
    router.replace({ path: '/payment/success', query: { orderNo: orderNo.value.toString(), payMethod: '3' } })
  } catch (error: any) {
    console.error('钱包支付失败:', error)
    toast.error(error.message || '钱包支付失败')
  }
}

const confirmPay = async () => {
  if (confirming.value) return

  confirming.value = true
  try {
    if (payType.value === 1) {
      await handleWechatPay()
    } else if (payType.value === 2) {
      await handleAlipayPay()
    } else if (payType.value === 3) {
      showWalletModal.value = true
    } else {
      toast.error('请选择支付方式')
    }
  } catch (error: any) {
    console.error('支付失败:', error)
    toast.error('支付失败')
  } finally {
    confirming.value = false
  }
}

const closeWalletModal = () => {
  showWalletModal.value = false
  walletPassword.value = ''
}

onMounted(() => {
  loadPayData()
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
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
          <h1 class="detail-title">确认订单</h1>
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
            <div class="pay-method-icon" v-html="getPayTypeIcon(payType)"></div>
            <span class="pay-method-name">{{ getPayTypeText(payType) }}</span>
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
        <h3 class="error-title">订单数据加载失败</h3>
        <button class="go-back-btn" @click="goBack">返回</button>
      </div>
    </div>

    <!-- 钱包支付密码弹窗 -->
    <div v-if="showWalletModal" class="modal-overlay" @click="closeWalletModal">
      <div class="wallet-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-title">输入支付密码</span>
          <button class="modal-close" @click="closeWalletModal">×</button>
        </div>
        <div class="modal-body">
          <div class="wallet-icon">💰</div>
          <p class="modal-desc">请输入您的钱包支付密码</p>
          <input
            type="password"
            v-model="walletPassword"
            class="password-input"
            placeholder="请输入6位数字密码"
            maxlength="6"
            @keyup.enter="handleWalletPay(walletPassword)"
          />
          <div class="password-tips">密码错误超过3次将锁定账户</div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeWalletModal">取消</button>
          <button class="modal-btn confirm-btn" @click="handleWalletPay(walletPassword)">确认支付</button>
        </div>
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
  margin: 0;
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
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.no-remark {
  color: var(--text-muted) !important;
}

.amount-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}

.amount-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.amount-value {
  font-size: 24px;
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
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: var(--primary-dark);
}

.confirm-btn.disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

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
}

.wallet-modal {
  background: white;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(74, 55, 40, 0.1);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
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
}

.modal-body {
  padding: 24px 20px;
  text-align: center;
}

.wallet-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.password-input {
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(74, 55, 40, 0.2);
  border-radius: var(--radius-md);
  font-size: 16px;
  text-align: center;
  letter-spacing: 4px;
  box-sizing: border-box;
}

.password-tips {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  border-top: 1px solid rgba(74, 55, 40, 0.1);
}

.modal-btn {
  flex: 1;
  padding: 14px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel-btn {
  background: transparent;
  color: var(--text-secondary);
  border-right: 1px solid rgba(74, 55, 40, 0.1);
}

.modal-btn.cancel-btn:hover {
  background: rgba(74, 55, 40, 0.05);
}

.modal-btn.confirm-btn {
  background: var(--primary-color);
  color: white;
}

.modal-btn.confirm-btn:hover {
  background: var(--primary-dark);
}
</style>
