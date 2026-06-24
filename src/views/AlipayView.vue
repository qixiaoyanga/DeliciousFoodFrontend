<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const isPaying = ref(false)
const orderNo = ref(0)
const payMethod = ref('2')
let pollTimer: number | null = null
let hasNavigated = false

const checkPayStatus = async () => {
  if (hasNavigated) return
  
  try {
    const orders = await orderApi.getDetail(orderNo.value)
    if (Array.isArray(orders) && orders.length > 0) {
      const order = orders[0]
      if (order.status === 1) {
        hasNavigated = true
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        router.replace({ 
          path: '/payment/success', 
          query: { orderNo: orderNo.value.toString(), payMethod: payMethod.value }
        })
      }
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
  }
}

onMounted(async () => {
  const orderNoParam = route.query.orderNo as string
  const payMethodParam = route.query.payMethod as string
  
  if (!orderNoParam) {
    toast.error('订单编号不存在')
    loading.value = false
    return
  }

  orderNo.value = parseInt(orderNoParam)
  if (payMethodParam) {
    payMethod.value = payMethodParam
  }
  
  try {
    const result = await orderApi.alipayPay(orderNo.value)
    console.log('支付宝返回:', result)
    
    if (typeof result === 'string' && result.includes('<form')) {
      // 清理反引号问题
      const cleanHtml = result.replace(/`/g, '"')
      
      // 直接写入文档
      document.open()
      document.write(cleanHtml)
      document.close()
      
      // 开始轮询支付状态
      isPaying.value = true
      pollTimer = window.setInterval(checkPayStatus, 3000)
      
      return
    } else {
      toast.error('获取支付页面失败')
    }
  } catch (error: any) {
    console.error('获取支付宝支付页面失败:', error)
    toast.error('支付通道暂时不可用，请稍后重试')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<template>
  <div class="alipay-view">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在跳转到支付宝支付...</p>
    </div>

    <div v-else-if="isPaying" class="polling-container">
      <div class="loading-spinner"></div>
      <p>正在等待支付完成...</p>
      <p class="hint">请在支付宝页面完成支付</p>
    </div>

    <div v-else class="error-container">
      <div class="error-icon">❌</div>
      <h3 class="error-title">跳转支付失败</h3>
      <button class="go-back-btn" @click="router.back()">返回</button>
    </div>
  </div>
</template>

<style scoped>
.alipay-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.loading-container,
.polling-container {
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

.polling-container p {
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: var(--text-secondary);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
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
</style>