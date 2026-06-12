<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Dish, DishSpec, DishAttribute, AttributeOption } from '@/types'
import { useCart } from '@/store/cart'
import { cartApi } from '@/api'
import { toast } from '@/utils/toast'

interface Props {
  dish: Dish | null
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const cart = useCart()

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
}

const selectedSpec = ref<DishSpec | null>(null)
const selectedAttributes = ref<Record<number, AttributeOption[]>>({})

watch(() => props.visible, (val) => {
  if (val && props.dish) {
    selectedSpec.value = null
    selectedAttributes.value = {}
    if (props.dish.specs && props.dish.specs.length > 0) {
      selectedSpec.value = props.dish.specs[0] as DishSpec
    }
    if (props.dish.attributes) {
      props.dish.attributes.forEach(attr => {
        if (attr.required && attr.options.length > 0) {
          selectedAttributes.value[attr.id] = [attr.options[0] as AttributeOption]
        } else {
          selectedAttributes.value[attr.id] = []
        }
      })
    }
  }
})

const totalPrice = computed(() => {
  if (!props.dish) return 0
  const basePrice = selectedSpec.value?.price || props.dish.salesPrice
  let attrPrice = 0
  if (props.dish.attributes) {
    props.dish.attributes.forEach(attr => {
      selectedAttributes.value[attr.id]?.forEach(opt => {
        attrPrice += opt.priceModifier || 0
      })
    })
  }
  return basePrice + attrPrice
})

const originalPrice = computed(() => {
  if (!props.dish) return 0
  const basePrice = selectedSpec.value?.price || props.dish.price
  let attrPrice = 0
  if (props.dish.attributes) {
    props.dish.attributes.forEach(attr => {
      selectedAttributes.value[attr.id]?.forEach(opt => {
        attrPrice += opt.priceModifier || 0
      })
    })
  }
  return basePrice + attrPrice
})

const canAddToCart = computed(() => {
  if (!props.dish) return false
  if (props.dish.specs && props.dish.specs.length > 0 && !selectedSpec.value) {
    return false
  }
  if (props.dish.attributes) {
    for (const attr of props.dish.attributes) {
      const selectedOptions = selectedAttributes.value[attr.id]
      if (attr.required && (!selectedOptions || selectedOptions.length === 0)) {
        return false
      }
    }
  }
  return true
})

const selectSpec = (spec: DishSpec) => {
  selectedSpec.value = spec
}

const toggleAttributeOption = (attr: DishAttribute, option: AttributeOption) => {
  const attrId = attr.id
  if (!selectedAttributes.value[attrId]) {
    selectedAttributes.value[attrId] = []
  }
  const index = selectedAttributes.value[attrId].findIndex(opt => opt.id === option.id)

  if (index > -1) {
    selectedAttributes.value[attrId].splice(index, 1)
  } else {
    if (attr.maxSelect === 1) {
      selectedAttributes.value[attrId] = [option]
    } else if (attr.maxSelect === -1) {
      selectedAttributes.value[attrId].push(option)
    } else {
      if (selectedAttributes.value[attrId].length < attr.maxSelect) {
        selectedAttributes.value[attrId].push(option)
      }
    }
  }
}

const addToCart = async () => {
  if (!props.dish || !canAddToCart.value) return

  const attributeOptionIds: number[] = []
  if (props.dish.attributes) {
    props.dish.attributes.forEach(attr => {
      selectedAttributes.value[attr.id]?.forEach(opt => {
        attributeOptionIds.push(opt.id)
      })
    })
  }

  try {
    await cartApi.add({
      shopId: props.dish.shopId,
      dishId: props.dish.id,
      quantity: 1,
      specId: selectedSpec.value?.id,
      attributeOptionIds: attributeOptionIds.length > 0 ? attributeOptionIds : undefined
    })

    toast.success('已添加到购物车')

    const cartItem = {
      id: Date.now(),
      dishId: props.dish.id,
      name: props.dish.name,
      price: props.dish.price,
      salesPrice: totalPrice.value,
      image: props.dish.image,
      shopId: props.dish.shopId,
      quantity: 1
    }

    cart.addItem(cartItem as any)
    emit('close')
  } catch (error: any) {
    toast.error(error.message || '添加失败，请重试')
  }
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible && dish" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content">
          <button class="close-btn" @click="handleClose">✕</button>

          <div class="dish-header">
            <div class="dish-image-wrapper">
              <img :src="getImageUrl(dish.image)" :alt="dish.name" class="dish-image" />
            </div>
            <div class="dish-info">
              <h2 class="dish-name">{{ dish.name }}</h2>
              <p class="dish-desc">{{ dish.description }}</p>
              <div class="dish-stats">
                <span class="stat">月售 {{ dish.monthSales }}</span>
                <span class="stat">库存 {{ dish.stock }}</span>
              </div>
              <div class="price-section">
                <span class="sales-price">¥{{ totalPrice.toFixed(2) }}</span>
                <span v-if="totalPrice < originalPrice" class="original-price">¥{{ originalPrice.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div v-if="dish.specs && dish.specs.length > 0" class="spec-section">
            <h3 class="section-title">
              <span class="section-icon">📦</span>
              规格
            </h3>
            <div class="spec-options">
              <button
                v-for="spec in dish.specs"
                :key="spec.name"
                class="spec-option"
                :class="{ active: selectedSpec?.name === spec.name }"
                @click="selectSpec(spec)"
              >
                {{ spec.name }}
                <span class="spec-price">¥{{ spec.price.toFixed(2) }}</span>
              </button>
            </div>
          </div>

          <div v-if="dish.attributes && dish.attributes.length > 0" class="attr-section">
            <div v-for="attr in dish.attributes" :key="attr.id" class="attr-group">
              <h4 class="attr-title">
                {{ attr.name }}
                <span v-if="attr.required" class="required">*</span>
                <span v-if="attr.maxSelect > 1 && attr.maxSelect !== -1" class="max-select">(最多选{{ attr.maxSelect }}项)</span>
                <span v-if="attr.maxSelect === -1" class="max-select">(不限制)</span>
              </h4>
              <div class="attr-options">
                <button
                  v-for="option in attr.options"
                  :key="option.id"
                  class="attr-option"
                  :class="{ active: selectedAttributes[attr.id]?.some(opt => opt.id === option.id) }"
                  @click="toggleAttributeOption(attr, option)"
                >
                  {{ option.name }}
                  <span v-if="option.priceModifier > 0" class="option-price">+¥{{ option.priceModifier.toFixed(2) }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-info">
              <span class="footer-label">配送费</span>
              <span class="footer-value">¥5.00</span>
            </div>
            <div class="footer-info">
              <span class="footer-label">打包费</span>
              <span class="footer-value">¥{{ dish.boxPrice.toFixed(2) }}</span>
            </div>
          </div>

          <button
            class="add-cart-btn"
            :class="{ disabled: !canAddToCart }"
            :disabled="!canAddToCart"
            @click="addToCart"
          >
            <span class="btn-icon">🛒</span>
            加入购物车
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(74, 55, 40, 0.08);
  border-radius: 50%;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: rgba(74, 55, 40, 0.15);
}

.dish-header {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.dish-image-wrapper {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-info {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.dish-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat {
  font-size: 13px;
  color: var(--text-muted);
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sales-price {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}

.original-price {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.spec-section, .attr-section {
  margin-bottom: 24px;
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

.section-icon {
  font-size: 16px;
}

.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.spec-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(74, 55, 40, 0.06);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.spec-option:hover {
  background: rgba(255, 107, 53, 0.08);
}

.spec-option.active {
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.spec-price {
  font-weight: 600;
}

.attr-group {
  margin-bottom: 16px;
}

.attr-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.required {
  color: #ef4444;
}

.max-select {
  font-size: 12px;
  font-weight: normal;
  color: var(--text-muted);
  margin-left: 6px;
}

.attr-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attr-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(74, 55, 40, 0.06);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.attr-option:hover {
  background: rgba(255, 107, 53, 0.08);
}

.attr-option.active {
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.option-price {
  font-size: 12px;
  font-weight: 600;
}

.footer {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(74, 55, 40, 0.04);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.footer-label {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-cart-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-cart-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.add-cart-btn.disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 20px;
}

@media screen and (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    width: 520px;
    max-height: 70vh;
    border-radius: var(--radius-xl);
    padding-bottom: 24px;
  }

  .dish-image-wrapper {
    width: 160px;
    height: 160px;
  }
}
</style>
