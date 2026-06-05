<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useCart } from '@/store/cart'
import { orderApi, cartApi } from '@/api'
import type { CartItem } from '@/types'

const cart = useCart()
const loading = ref(true)
const submitting = ref(false)
const orderCreated = ref(false)
const orderId = ref(0)

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
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

const selectedAddressId = ref(addresses.value.find(a => a.isDefault)?.id || addresses.value[0]?.id || 0)
const remark = ref('')
const payType = ref(1)

const selectedAddress = computed(() => {
  return addresses.value.find(a => a.id === selectedAddressId.value)
})

const selectedItems = computed(() => {
  return cart.items.value.filter(item => item.selected)
})

const groupedItems = computed(() => {
  const groups: Record<number, { shopName: string; delivery: number; boxFee: number; items: CartItem[] }> = {}
  selectedItems.value.forEach(item => {
    const key = item.shopId
    if (!groups[key]) {
      groups[key] = {
        shopName: item.shopName || '',
        delivery: item.shopDelivery || 0,
        boxFee: item.boxPrice || 0,
        items: []
      }
    }
    groups[key].items.push(item)
    if (item.shopDelivery !== undefined && item.shopDelivery > 0) {
      groups[key].delivery = item.shopDelivery
    }
  })
  return groups
})

const selectedCount = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const selectedTotalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + (item.totalPrice || item.salesPrice) * item.quantity, 0)
})

const selectedDelivery = computed(() => {
  const shopIds = new Set(selectedItems.value.map(item => item.shopId))
  let totalDelivery = 0
  shopIds.forEach(shopId => {
    const group = groupedItems.value[shopId]
    if (group) {
      totalDelivery += group.delivery
    }
  })
  return totalDelivery
})

const selectedBoxFee = computed(() => {
  const shopIds = new Set(selectedItems.value.map(item => item.shopId))
  let totalBoxFee = 0
  shopIds.forEach(shopId => {
    const group = groupedItems.value[shopId]
    if (group) {
      totalBoxFee += group.boxFee
    }
  })
  return totalBoxFee
})

const totalAmount = computed(() => {
  return selectedTotalPrice.value + selectedDelivery.value + selectedBoxFee.value
})

onMounted(() => {
  loading.value = false
})

const handleSubmit = async () => {
  if (!selectedAddress.value) {
    alert('请选择收货地址')
    return
  }

  submitting.value = true
  try {
    const orders = await Promise.all(
      Object.entries(groupedItems.value).map(async ([shopId, group]) => {
        const items = group.items.map(item => ({
          cartId: item.id,
          quantity: item.quantity
        }))
        
        const orderData = {
          shopId: parseInt(shopId),
          items,
          remark: remark.value,
          address: selectedAddress.value.address,
          addressName: selectedAddress.value.name,
          addressPhone: selectedAddress.value.phone,
          payType: payType.value
        }
        
        return await orderApi.create(orderData)
      })
    )
    
    orderId.value = orders[0]?.orderId || 0
    orderCreated.value = true
    
    await cartApi.clear(cart.items.value.filter(item => item.selected).map(item => item.id))
    
    setTimeout(() => {
      window.location.href = `/order/detail/${orderId.value}`
    }, 2000)
  } catch (error: any) {
    console.error('创建订单失败:', error)
    alert('创建订单失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  window.history.back()
}
</script>

<template>
  <div class="checkout-view">
    <div class="container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>

      <div v-else-if="orderCreated" class="success-container">
        <div class="success-icon">✅</div>
        <h2 class="success-title">订单提交成功</h2>
        <p class="success-text">订单号: {{ orderId }}</p>
        <p class="success-hint">正在跳转到订单详情...</p>
      </div>

      <div v-else>
        <div class="checkout-header">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
          </button>
          <h1 class="checkout-title">确认订单</h1>
          <div class="placeholder"></div>
        </div>

        <div v-if="selectedItems.length === 0" class="empty-cart">
          <div class="empty-icon">🛒</div>
          <h3 class="empty-title">还没有选择商品</h3>
          <button class="go-shopping-btn" @click="goBack">返回购物车</button>
        </div>

        <div v-else class="checkout-content">
          <div class="address-section">
            <div class="section-title">
              <span class="title-icon">📍</span>
              <span>收货地址</span>
            </div>
            <div class="address-list">
              <label
                v-for="addr in addresses"
                :key="addr.id"
                class="address-card"
                :class="{ selected: selectedAddressId === addr.id }"
              >
                <input
                  type="radio"
                  name="address"
                  :value="addr.id"
                  v-model="selectedAddressId"
                />
                <div class="address-info">
                  <div class="address-user">
                    <span class="user-name">{{ addr.name }}</span>
                    <span class="user-phone">{{ addr.phone }}</span>
                    <span v-if="addr.isDefault" class="default-tag">默认</span>
                  </div>
                  <p class="address-detail">{{ addr.address }}</p>
                </div>
                <span class="check-icon" v-if="selectedAddressId === addr.id">✓</span>
              </label>
            </div>
          </div>

          <div class="order-section">
            <div class="section-title">
              <span class="title-icon">📦</span>
              <span>商品清单</span>
            </div>
            
            <div 
              v-for="(group, shopId) in groupedItems" 
              :key="shopId" 
              class="shop-group"
            >
              <div class="shop-header">
                <span class="shop-icon">🏪</span>
                <span class="shop-name">{{ group.shopName }}</span>
              </div>
              
              <div class="item-list">
                <div 
                  v-for="item in group.items" 
                  :key="item.id" 
                  class="order-item"
                >
                  <div class="item-image-wrapper">
                    <img :src="getImageUrl(item.image)" :alt="item.name" class="item-image" />
                  </div>
                  
                  <div class="item-info">
                    <h4 class="item-name">{{ item.name }}</h4>
                    <div class="item-specs">
                      <span v-if="item.specName" class="spec-tag">{{ item.specName }}</span>
                      <span 
                        v-for="attr in item.attributeOptions" 
                        :key="attr.id" 
                        class="attr-tag"
                      >
                        {{ attr.name }} +¥{{ attr.priceModifier.toFixed(2) }}
                      </span>
                    </div>
                    <div class="item-footer">
                      <span class="item-price">¥{{ (item.totalPrice || item.salesPrice).toFixed(2) }}</span>
                      <span class="item-quantity">x{{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="shop-fee">
                <span class="fee-label">配送费</span>
                <span class="fee-value">¥{{ group.delivery.toFixed(2) }}</span>
              </div>
              <div class="shop-fee">
                <span class="fee-label">打包费</span>
                <span class="fee-value">¥{{ group.boxFee.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="remark-section">
            <div class="section-title">
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

          <div class="pay-section">
            <div class="section-title">
              <span class="title-icon">💳</span>
              <span>支付方式</span>
            </div>
            <div class="pay-options">
              <label class="pay-option">
                <input type="radio" name="payType" :value="1" v-model="payType" />
                <span class="pay-icon">💚</span>
                <span class="pay-name">1.微信支付</span>
              </label>
              <label class="pay-option">
                <input type="radio" name="payType" :value="2" v-model="payType" />
                <span class="pay-icon">💙</span>
                <span class="pay-name">2.支付宝</span>
              </label>
              <label class="pay-option">
                <input type="radio" name="payType" :value="3" v-model="payType" />
                <span class="pay-icon">👛</span>
                <span class="pay-name">3.钱包</span>
              </label>
            </div>
          </div>
        </div>

        <div class="checkout-footer">
          <div class="footer-left">
            <span class="total-label">合计:</span>
            <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <button 
            class="submit-btn" 
            @click="handleSubmit"
            :disabled="submitting"
          >
            <span v-if="submitting" class="loading-dot">...</span>
            <span v-else>提交订单</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-view {
  min-height: calc(100vh - 120px);
  padding-bottom: 100px;
  background: var(--bg-secondary);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-container {
  text-align: center;
  padding: 80px 20px;
}

.success-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 0.5s ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.success-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.success-hint {
  font-size: 14px;
  color: var(--text-muted);
}

.checkout-header {
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

.checkout-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.placeholder {
  width: 40px;
}

.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.go-shopping-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.checkout-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.title-icon {
  font-size: 18px;
}

.address-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.address-card:hover {
  border-color: rgba(255, 107, 53, 0.2);
}

.address-card.selected {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.03);
}

.address-card input {
  margin-top: 4px;
}

.address-info {
  flex: 1;
}

.address-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-phone {
  font-size: 14px;
  color: var(--text-secondary);
}

.default-tag {
  padding: 2px 8px;
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
  font-size: 11px;
  border-radius: 4px;
}

.address-detail {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.check-icon {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 16px;
}

.order-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
}

.shop-group {
  margin-bottom: 16px;
  border-bottom: 1px dashed rgba(74, 55, 40, 0.08);
  padding-bottom: 16px;
}

.shop-group:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.shop-icon {
  font-size: 16px;
}

.shop-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-list {
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
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
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
  font-size: 11px;
  border-radius: 4px;
}

.attr-tag {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  font-size: 11px;
  border-radius: 4px;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.item-quantity {
  font-size: 13px;
  color: var(--text-muted);
}

.shop-fee {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.fee-label {
  color: var(--text-secondary);
}

.fee-value {
  color: var(--text-primary);
}

.remark-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  resize: none;
  box-sizing: border-box;
}

.remark-input::placeholder {
  color: var(--text-muted);
}

.pay-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
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

.pay-icon {
  font-size: 20px;
}

.pay-name {
  font-size: 14px;
  color: var(--text-primary);
}

.checkout-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.footer-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.submit-btn {
  padding: 14px 48px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-dot {
  animation: loading 1s infinite;
}

@keyframes loading {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@media screen and (max-width: 768px) {
  .checkout-view {
    min-height: calc(100vh - 100px);
  }
  
  .pay-options {
    gap: 12px;
  }
  
  .pay-option {
    padding: 10px 12px;
  }
}
</style>