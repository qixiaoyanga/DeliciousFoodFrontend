<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderApi, cartApi, addressApi } from '@/api'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const creatingOrder = ref(false)

// 购物车商品数据
const cartItems = ref<any[]>([])
const cartIds = ref<number[]>([])

// 地址相关
const addresses = ref<any[]>([])
const selectedAddress = ref<any>(null)

// 备注和支付方式
const remark = ref('')
const payType = ref(1)

// 店铺分组
const groupedItems = computed(() => {
  const groups: Record<number, { shopName: string; delivery: number; items: any[] }> = {}
  cartItems.value.forEach(item => {
    const key = item.shopId
    if (!groups[key]) {
      groups[key] = {
        shopName: item.shopName || '',
        delivery: item.delivery || 0,
        items: []
      }
    }
    groups[key].items.push(item)
  })
  return groups
})

// 计算金额
const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.totalPrice || item.salesPrice * item.quantity), 0)
})

const totalDeliveryFee = computed(() => {
  return Object.values(groupedItems.value).reduce((sum, group) => sum + group.delivery, 0)
})

const totalBoxFee = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.boxPrice || 0) * item.quantity, 0)
})

const actualTotal = computed(() => {
  return totalAmount.value + totalDeliveryFee.value
})

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

const getPayTypeText = (type: number) => {
  const payMap: Record<number, string> = {
    1: '微信支付',
    2: '支付宝',
    3: '钱包'
  }
  return payMap[type] || '未知'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 获取购物车id
    const cartIdsStr = sessionStorage.getItem('checkoutCartIds')
    if (cartIdsStr) {
      cartIds.value = JSON.parse(cartIdsStr)
    }

    // 获取购物车数据
    const cartData = await cartApi.get()
    if (Array.isArray(cartData)) {
      cartItems.value = cartData.filter((item: any) => cartIds.value.includes(item.id))
    }

    // 获取地址列表
    const addrList = await addressApi.getList()
    addresses.value = addrList || []

    // 先检查本地存储是否有选中的地址
    const savedAddress = sessionStorage.getItem('selectedAddress')
    if (savedAddress) {
      try {
        const addr = JSON.parse(savedAddress)
        console.log('从本地存储加载地址:', addr)
        selectedAddress.value = {
          id: addr.id,
          consignee: addr.consignee,
          phone: addr.phone,
          province: addr.province || '',
          city: addr.city || '',
          district: addr.district || '',
          detail: addr.detail || '',
          defaulted: addr.defaulted || 0
        }
        sessionStorage.removeItem('selectedAddress')
        return
      } catch (e) {
        console.error('解析本地存储地址失败:', e)
        sessionStorage.removeItem('selectedAddress')
      }
    }

    // 如果本地没有，设置默认地址
    const defaultAddr = addresses.value.find((a: any) => a.defaulted === 1)
    if (defaultAddr) {
      selectedAddress.value = defaultAddr
    } else if (addresses.value.length > 0) {
      selectedAddress.value = addresses.value[0]
    }
  } catch (error: any) {
    console.error('加载数据失败:', error)
    toast.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 选择地址
const selectAddress = () => {
  sessionStorage.setItem('needSelectAddress', 'true')
  router.push({ path: '/address', query: { select: 'true' } })
}

// 恢复地址选择
const restoreAddress = () => {
  const savedAddress = sessionStorage.getItem('selectedAddress')
  if (savedAddress) {
    selectedAddress.value = JSON.parse(savedAddress)
    sessionStorage.removeItem('selectedAddress')
  }
}

// 支付方式变更
const handlePayTypeChange = (type: number) => {
  payType.value = type
}

// 创建订单
const createOrder = async () => {
  if (!selectedAddress.value) {
    toast.error('请选择收货地址')
    return
  }

  creatingOrder.value = true
  try {
    const addressInfo = {
      id: selectedAddress.value.id,
      consignee: selectedAddress.value.consignee,
      phone: selectedAddress.value.phone,
      province: selectedAddress.value.province || '',
      city: selectedAddress.value.city || '',
      district: selectedAddress.value.district || '',
      detail: selectedAddress.value.detail,
      fullAddress: `${selectedAddress.value.province || ''}${selectedAddress.value.city || ''}${selectedAddress.value.district || ''}${selectedAddress.value.detail}`
    }

    const confirmPaymentDTO = {
      orderNo: 0,
      payType: payType.value,
      remark: remark.value || '',
      address: addressInfo
    }

    const orderData = {
      cartIds: cartIds.value,
      remark: remark.value,
      payType: payType.value,
      address: addressInfo
    }

    const result = await orderApi.create(orderData)

    if (result.orders && result.orders.length > 0) {
      const orderNo = result.orders[0].orderNo
      confirmPaymentDTO.orderNo = orderNo
      sessionStorage.setItem('confirmPaymentDTO', JSON.stringify(confirmPaymentDTO))
      sessionStorage.removeItem('checkoutCartIds')
      router.push({ path: `/order/${orderNo}/pay` })
    } else {
      throw new Error('订单创建失败')
    }
  } catch (error: any) {
    console.error('创建订单失败:', error)
    toast.error('创建订单失败: ' + (error.message || '未知错误'))
  } finally {
    creatingOrder.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadData()
})

watch(() => route.query, () => {
  console.log('路由参数变化，重新加载数据')
  loadData()
}, { deep: true })
</script>

<template>
  <div class="order-confirm-view">
    <div class="container">
      <div class="detail-header">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h1 class="detail-title">确认订单</h1>
        <div class="placeholder"></div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else class="order-content">
        <!-- 收货地址 -->
        <div class="address-section">
          <div class="card-title">
            <span class="title-icon">📍</span>
            <span>收货地址</span>
          </div>
          <div v-if="selectedAddress" class="address-card" @click="selectAddress">
            <div class="address-user">
              <span class="user-name">{{ selectedAddress.consignee }}</span>
              <span class="user-phone">{{ selectedAddress.phone }}</span>
              <span v-if="selectedAddress.defaulted === 1" class="default-tag">默认</span>
            </div>
            <p class="address-detail">
              {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
            </p>
            <button class="change-btn">更换</button>
          </div>
          <div v-else class="no-address" @click="selectAddress">
            <span class="no-address-text">请添加收货地址</span>
            <button class="add-address-btn">添加地址</button>
          </div>
        </div>

        <!-- 商品信息 -->
        <div v-for="(group, shopId) in groupedItems" :key="shopId" class="shop-order-card">
          <div class="shop-header">
            <span class="shop-icon">🏪</span>
            <span class="shop-name">{{ group.shopName }}</span>
            <span class="shop-fee">配送费: ¥{{ group.delivery.toFixed(2) }}</span>
          </div>

          <div class="items-list">
            <div v-for="item in group.items" :key="item.id" class="order-item">
              <div class="item-image-wrapper">
                <img :src="getImageUrl(item.dishImage)" :alt="item.dishName" class="item-image" />
              </div>
              <div class="item-info">
                <h4 class="item-name">{{ item.dishName }}</h4>
                <div class="item-specs">
                  <span v-if="item.specName" class="spec-tag">{{ item.specName }}</span>
                  <span
                    v-for="attr in item.attributeOptions"
                    :key="attr.id"
                    class="attr-tag"
                  >
                    {{ attr.name }}
                  </span>
                </div>
                <div class="item-footer">
                  <span class="item-price">¥{{ item.salesPrice.toFixed(2) }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="remark-section">
          <div class="card-title">
            <span class="title-icon">📝</span>
            <span>订单备注</span>
          </div>
          <textarea
            class="remark-input"
            placeholder="如有特殊要求，请在此备注..."
            rows="3"
            v-model="remark"
          ></textarea>
        </div>

        <!-- 支付方式 -->
        <div class="pay-section">
          <div class="card-title">
            <span class="title-icon">💳</span>
            <span>支付方式</span>
          </div>
          <div class="pay-options">
            <label class="pay-option" :class="{ selected: payType === 1 }">
              <input type="radio" name="payType" :value="1" v-model="payType" @change="handlePayTypeChange(1)" />
              <svg class="pay-icon-svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" fill="#07C160"/>
                <path d="M9.5 15.5C9.5 15.5 7 13.5 7 11C7 9 9.5 7 12 7C14.5 7 17 9 17 11C17 13.5 14.5 15.5 14.5 15.5" fill="#07C160"/>
                <circle cx="9" cy="10" r="1.5" fill="white"/>
                <circle cx="15" cy="10" r="1.5" fill="white"/>
                <path d="M12 16C13 16.5 14 17 14.5 17.5C14 17 13 16.5 12 16Z" fill="white"/>
              </svg>
              <span class="pay-name">微信支付</span>
            </label>
            <label class="pay-option" :class="{ selected: payType === 2 }">
              <input type="radio" name="payType" :value="2" v-model="payType" @change="handlePayTypeChange(2)" />
              <svg class="pay-icon-svg" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="#1677FF"/>
                <path d="M7 12L10 15L17 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              <span class="pay-name">支付宝</span>
            </label>
            
          </div>
        </div>

        <!-- 金额信息 -->
        <div class="payment-card">
          <div class="payment-row">
            <span class="payment-label">商品金额</span>
            <span class="payment-value">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">配送费</span>
            <span class="payment-value">¥{{ totalDeliveryFee.toFixed(2) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">(含打包费)</span>
            <span class="payment-value"></span>
          </div>
          <div class="payment-row total">
            <span class="payment-label">合计</span>
            <span class="payment-value">¥{{ actualTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="action-buttons">
          <button
            class="submit-btn"
            :disabled="creatingOrder || !selectedAddress"
            @click="createOrder"
          >
            {{ creatingOrder ? '提交中...' : `提交订单 (¥${actualTotal.toFixed(2)})` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-confirm-view {
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

.address-section,
.shop-order-card,
.remark-section,
.pay-section,
.payment-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
}

.address-card {
  position: relative;
  padding: 12px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
  cursor: pointer;
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

.default-tag {
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

.address-detail {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.change-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px 12px;
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
}

.no-address {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.no-address-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.add-address-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
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

.spec-tag,
.attr-tag {
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

.pay-options {
  display: flex;
  gap: 12px;
}

.pay-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.pay-option:hover {
  border-color: rgba(255, 107, 53, 0.3);
}

.pay-option.selected {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.05);
}

.pay-option input {
  display: none;
}

.pay-icon-svg {
  width: 32px;
  height: 32px;
}

.pay-name {
  font-size: 13px;
  color: var(--text-primary);
}

.payment-card {
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

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.submit-btn:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

@media screen and (max-width: 768px) {
  .order-confirm-view {
    min-height: calc(100vh - 80px);
    padding-bottom: 80px;
  }

  .pay-options {
    flex-direction: column;
  }

  .pay-option {
    flex-direction: row;
    justify-content: flex-start;
  }
}
</style>
