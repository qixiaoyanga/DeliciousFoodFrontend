<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const orderNo = ref('')
const payMethod = ref('')
const showContent = ref(false)

const payMethodText = computed(() => {
  const payMap: Record<string, string> = {
    '1': '微信支付',
    '2': '支付宝',
    '3': '钱包'
  }
  return payMap[payMethod.value] || '未知'
})

const payMethodIcon = computed(() => {
  const iconMap: Record<string, string> = {
    '1': '💳',
    '2': '💰',
    '3': '👛'
  }
  return iconMap[payMethod.value] || '💳'
})

const loadData = async () => {
  orderNo.value = route.query.orderNo as string || ''
  payMethod.value = route.query.payMethod as string || ''

  // 模拟加载延迟以展示动画
  setTimeout(() => {
    loading.value = false
    setTimeout(() => {
      showContent.value = true
    }, 100)
  }, 500)
}

const goHome = () => {
  router.push('/')
}

const goOrderList = () => {
  router.push('/order')
}

const goOrderDetail = () => {
  if (orderNo.value) {
    router.push(`/order/detail/${orderNo.value}`)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="payment-success-view">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="container">
      <!-- Loading 状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-icon">
          <div class="loading-ring"></div>
          <div class="loading-dot"></div>
        </div>
        <p class="loading-text">正在确认支付...</p>
      </div>

      <!-- 成功内容 -->
      <Transition name="fade-scale">
        <div v-if="!loading && showContent" class="success-content">
          <!-- 成功动画区域 -->
          <div class="success-hero">
            <div class="success-circle">
              <div class="success-checkmark">
                <svg class="checkmark-svg" viewBox="0 0 52 52">
                  <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <div class="success-particles">
                <span class="particle">✨</span>
                <span class="particle">🎉</span>
                <span class="particle">✨</span>
              </div>
            </div>
            <h1 class="success-title">支付成功</h1>
            <p class="success-subtitle">感谢您的信任与支持</p>
          </div>

          <!-- 订单信息卡片 -->
          <div class="order-info-card">
            <div class="order-info-header">
              <span class="header-icon">📋</span>
              <span class="header-text">订单信息</span>
            </div>
            <div class="order-info-body">
              <div class="info-item">
                <div class="info-item-left">
                  <span class="info-icon">🔢</span>
                  <span class="info-label">订单编号</span>
                </div>
                <span class="info-value order-no">{{ orderNo }}</span>
              </div>
              <div class="info-item">
                <div class="info-item-left">
                  <span class="info-icon">{{ payMethodIcon }}</span>
                  <span class="info-label">支付方式</span>
                </div>
                <span class="info-value">{{ payMethodText }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="action-btn secondary" @click="goOrderDetail">
              <span class="btn-icon">📦</span>
              <span>查看订单详情</span>
            </button>
            <button class="action-btn primary" @click="goHome">
              <span class="btn-icon">🏠</span>
              <span>返回首页</span>
            </button>
          </div>

          <!-- 底部提示 -->
          <div class="tips-section">
            <div class="tip-item">
              <span class="tip-icon">🚚</span>
              <span class="tip-text">我们已收到您的订单</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">⏰</span>
              <span class="tip-text">商家将尽快为您准备</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">📱</span>
              <span class="tip-text">可在"我的订单"查看进度</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.payment-success-view {
  min-height: calc(100vh - 100px);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #FFF5F0 0%, #FFF9F5 50%, #FFF5F0 100%);
  padding: 40px 20px;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 107, 53, 0.02) 100%);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: -80px;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Loading 状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
}

.loading-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.loading-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(255, 107, 53, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.loading-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* 过渡动画 */
.fade-scale-enter-active {
  transition: all 0.5s ease-out;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.fade-scale-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 成功内容 */
.success-content {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 20px 60px rgba(255, 107, 53, 0.1), 0 8px 24px rgba(0, 0, 0, 0.05);
}

/* 成功英雄区域 */
.success-hero {
  text-align: center;
  margin-bottom: 32px;
}

.success-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
}

.success-checkmark {
  width: 100%;
  height: 100%;
  animation: scaleIn 0.5s ease-out 0.3s both;
}

.checkmark-svg {
  width: 100%;
  height: 100%;
}

.checkmark-circle {
  stroke: #07C160;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  stroke: #07C160;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.7s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  font-size: 24px;
  animation: particleFloat 2s ease-in-out infinite;
}

.particle:nth-child(1) {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.particle:nth-child(2) {
  top: 5%;
  right: 15%;
  animation-delay: 0.5s;
}

.particle:nth-child(3) {
  bottom: 15%;
  left: 5%;
  animation-delay: 1s;
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-10px) rotate(10deg);
    opacity: 0.7;
  }
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  animation: fadeInUp 0.5s ease-out 0.5s both;
}

.success-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  animation: fadeInUp 0.5s ease-out 0.6s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 订单信息卡片 */
.order-info-card {
  background: linear-gradient(135deg, #FFF9F5 0%, #FFF5F0 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 107, 53, 0.1);
  animation: fadeInUp 0.5s ease-out 0.7s both;
}

.order-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(255, 107, 53, 0.2);
}

.header-icon {
  font-size: 18px;
}

.header-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-info-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 16px;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-value.order-no {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: var(--primary-color);
  background: rgba(255, 107, 53, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  animation: fadeInUp 0.5s ease-out 0.8s both;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8A65 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(255, 107, 53, 0.4);
}

.action-btn.secondary {
  background: white;
  color: var(--text-primary);
  border: 2px solid rgba(74, 55, 40, 0.1);
}

.action-btn.secondary:hover {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.05);
}

.btn-icon {
  font-size: 18px;
}

/* 底部提示 */
.tips-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeInUp 0.5s ease-out 0.9s both;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: 10px;
}

.tip-icon {
  font-size: 16px;
}

.tip-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 响应式 */
@media screen and (max-width: 640px) {
  .payment-success-view {
    padding: 20px 16px;
  }

  .success-content {
    padding: 32px 20px;
    border-radius: 20px;
  }

  .success-circle {
    width: 100px;
    height: 100px;
  }

  .success-title {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
