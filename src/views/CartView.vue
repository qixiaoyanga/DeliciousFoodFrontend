<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/store/cart'
import { cartApi } from '@/api'
import type { CartItem } from '@/types'

const router = useRouter()

const cart = useCart()
const loading = ref(true)

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
}

interface CartItemResponse {
  id: number
  dishId: number
  shopId: number
  shopName: string
  dishName: string
  dishImage: string
  specId?: number
  specName?: string
  attributeOptions?: Array<{
    id: number
    name: string
    priceModifier: number
  }>
  quantity: number
  price: number
  salesPrice: number
  boxPrice: number
  totalPrice: number
  delivery?: number
}

const loadCart = async () => {
  loading.value = true
  try {
    const cartData = await cartApi.get()
    if (cartData && Array.isArray(cartData)) {
      const items: CartItem[] = cartData.map((item: CartItemResponse) => ({
        id: item.id,
        dishId: item.dishId,
        shopId: item.shopId,
        shopName: item.shopName,
        shopDelivery: item.delivery,
        name: item.dishName,
        image: item.dishImage,
        price: item.price,
        salesPrice: item.salesPrice,
        boxPrice: item.boxPrice,
        totalPrice: item.totalPrice,
        quantity: item.quantity,
        specName: item.specName,
        attributeOptions: item.attributeOptions,
        selected: true
      }))
      cart.setItems(items)
    } else {
      cart.clearCart()
    }
  } catch (error) {
    console.error('加载购物车失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCart()
})

const groupedItems = computed(() => {
  const groups: Record<number, { shopName: string; delivery: number; boxFee: number; items: CartItem[] }> = {}
  cart.items.value.forEach(item => {
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

const selectedItems = computed(() => {
  return cart.items.value.filter(item => item.selected)
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
    if (group && group.items.some(item => item.selected)) {
      totalBoxFee += group.boxFee
    }
  })
  return totalBoxFee
})

const allSelected = computed(() => {
  return cart.items.value.length > 0 && cart.items.value.every(item => item.selected)
})

const toggleItemSelect = (itemId: number) => {
  const item = cart.getItemById(itemId)
  if (item) {
    item.selected = !item.selected
  }
}

const toggleShopSelect = (shopId: number) => {
  const items = cart.items.value.filter(item => item.shopId === shopId)
  const allSelected = items.every(item => item.selected)
  items.forEach(item => {
    item.selected = !allSelected
  })
}

const selectAll = () => {
  const allSelected = cart.items.value.every(item => item.selected)
  cart.items.value.forEach(item => {
    item.selected = !allSelected
  })
}

const handleQuantityChange = async (itemId: number, delta: number) => {
  const item = cart.getItemById(itemId)
  if (!item) return

  const newQuantity = item.quantity + delta
  if (newQuantity <= 0) {
    await handleRemoveItem(itemId)
    return
  }

  try {
    await cartApi.updateQuantity({ id: itemId, quantity: newQuantity })
    cart.updateQuantity(itemId, newQuantity)
  } catch (error: any) {
    console.error('更新数量失败:', error)
  }
}

const handleRemoveItem = async (itemId: number) => {
  try {
    await cartApi.remove({ cartIds: [itemId] })
    cart.removeItem(itemId)
  } catch (error: any) {
    console.error('删除商品失败:', error)
  }
}

const handleClearCart = async () => {
  if (!confirm('确定要清空购物车吗？')) return

  const allCartIds = cart.items.value.map(item => item.id)
  try {
    await cartApi.clear(allCartIds)
    cart.clearCart()
  } catch (error: any) {
    console.error('清空购物车失败:', error)
  }
}

const handleCheckout = () => {
  if (selectedItems.value.length === 0) {
    alert('请先选择要结算的商品')
    return
  }
  const selectedCartIds = selectedItems.value.map(item => item.id).join(',')
  router.push({ path: '/order/detail', query: { cartIds: selectedCartIds } })
}

const goShopping = () => {
  router.push('/')
}
</script>

<template>
  <div class="cart-view">
    <div class="container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载购物车...</p>
      </div>
      <div v-else>
        <div class="cart-header">
          <h1 class="cart-title">🛒 我的购物车</h1>
        <button
          v-if="cart.totalCount.value > 0"
          class="clear-btn"
          @click="handleClearCart"
        >
          <span class="clear-icon">🗑️</span>
          清空购物车
        </button>
      </div>

      <div v-if="cart.items.value.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3 class="empty-title">购物车是空的</h3>
        <p class="empty-text">快去挑选美味的食物吧</p>
        <button class="go-shopping-btn" @click="goShopping">
          <span class="btn-icon">🍽️</span>
          去逛逛
        </button>
      </div>

      <div v-else class="cart-content">
        <div class="cart-items">
          <div class="all-select-header">
            <label class="checkbox-container">
              <input type="checkbox" v-model="allSelected" @change="selectAll" />
              <span class="checkmark"></span>
            </label>
            <span class="all-select-text">全选</span>
          </div>

          <div
            v-for="(group, shopId) in groupedItems"
            :key="shopId"
            class="shop-group"
          >
            <div class="shop-header">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  :checked="group.items.every(item => item.selected)"
                  @change="toggleShopSelect(shopId)"
                />
                <span class="checkmark"></span>
              </label>
              <span class="shop-icon">🏪</span>
              <span class="shop-name">{{ group.shopName || '店铺 ' + shopId }}</span>
  <span class="shop-delivery">配送费: ¥{{ group.delivery.toFixed(2) }}</span>
              <span class="shop-box-fee">打包费: ¥{{ group.boxFee.toFixed(2) }}</span>
            </div>

            <div class="item-list">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="cart-item"
                :class="{ selected: item.selected }"
              >
                <label class="checkbox-container item-checkbox">
                  <input
                    type="checkbox"
                    v-model="item.selected"
                  />
                  <span class="checkmark"></span>
                </label>

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
                    <div class="item-price">
                      <span class="sales-price">¥{{ (item.totalPrice || item.salesPrice).toFixed(2) }}</span>
                      <span v-if="item.price > (item.totalPrice || item.salesPrice)" class="original-price">
                        ¥{{ item.price.toFixed(2) }}
                      </span>
                    </div>

                    <div class="quantity-control">
                      <button
                        class="qty-btn qty-minus"
                        @click="handleQuantityChange(item.id, -1)"
                      >
                        -
                      </button>
                      <span class="qty-value">{{ item.quantity }}</span>
                      <button
                        class="qty-btn qty-plus"
                        @click="handleQuantityChange(item.id, 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  class="remove-btn"
                  @click="handleRemoveItem(item.id)"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span class="summary-label">已选商品</span>
            <span class="summary-value">{{ selectedCount }} 件</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">商品金额</span>
            <span class="summary-value">¥{{ selectedTotalPrice.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">配送费</span>
            <span class="summary-value">¥{{ selectedDelivery.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">打包费</span>
            <span class="summary-value">¥{{ selectedBoxFee.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
  <span class="summary-label">合计</span>
            <span class="summary-value">¥{{ (selectedTotalPrice + selectedDelivery + selectedBoxFee).toFixed(2) }}</span>
          </div>

          <button class="checkout-btn" @click="handleCheckout">
            <span class="checkout-icon">💳</span>
            去结算 ({{ selectedCount }})
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-view {
  min-height: calc(100vh - 180px);
  padding: 40px 20px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.03) 0%, rgba(255, 217, 61, 0.03) 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
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

.loading-container p {
  color: #999;
  font-size: 14px;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.cart-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.clear-icon {
  font-size: 16px;
}

.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.go-shopping-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.go-shopping-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.btn-icon {
  font-size: 18px;
}

.cart-content {
  display: flex;
  gap: 30px;
}

.cart-items {
  flex: 1;
}

.all-select-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.all-select-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 24px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-container .checkmark {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  width: 18px;
  background-color: #eee;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #f5f5f5;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.shop-group {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  overflow: hidden;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 217, 61, 0.05) 100%);
  border-bottom: 1px solid rgba(74, 55, 40, 0.08);
}

.shop-icon {
  font-size: 18px;
}

.shop-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.shop-delivery {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-secondary);
}

.shop-box-fee {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 12px;
}

.item-list {
  padding: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px dashed rgba(74, 55, 40, 0.08);
  transition: background var(--transition-fast);
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item:hover {
  background: rgba(74, 55, 40, 0.02);
}

.cart-item.selected {
  background: rgba(255, 107, 53, 0.03);
}

.item-checkbox {
  flex-shrink: 0;
}

.item-image-wrapper {
  width: 90px;
  height: 90px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  flex-grow: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.spec-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 107, 53, 0.08) 100%);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 53, 0.15);
}

.attr-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.15);
}



.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sales-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.original-price {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.quantity-control {
  display: flex;
  align-items: center;
  background: rgba(74, 55, 40, 0.05);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.qty-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.qty-btn:hover {
  background: rgba(74, 55, 40, 0.1);
}

.qty-btn:active {
  background: rgba(255, 107, 53, 0.1);
}

.qty-value {
  min-width: 36px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.cart-summary {
  width: 280px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  position: sticky;
  top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed rgba(74, 55, 40, 0.08);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  padding-top: 20px;
  padding-bottom: 20px;
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-row.total .summary-value {
  font-size: 24px;
  color: var(--primary-color);
}

.checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.checkout-btn:active {
  transform: translateY(0);
}

.checkout-icon {
  font-size: 18px;
}

@media screen and (max-width: 768px) {
  .cart-content {
    flex-direction: column;
  }

  .cart-summary {
    width: 100%;
    position: relative;
  }

  .cart-title {
    font-size: 24px;
  }

  .item-image-wrapper {
    width: 60px;
    height: 60px;
  }

  .item-name {
    font-size: 14px;
  }
}
</style>
