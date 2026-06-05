import { ref, computed } from 'vue'
import type { CartItem, Dish } from '@/types'

const cartItems = ref<CartItem[]>([])

export const useCart = () => {
  const items = computed(() => cartItems.value)

  const totalCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.salesPrice * item.quantity, 0)
  })

  const addItem = (dish: Dish) => {
    const existingItem = cartItems.value.find(item => item.dishId === dish.id)
    
    if (existingItem) {
      existingItem.quantity++
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        salesPrice: dish.salesPrice,
        image: dish.image,
        shopId: dish.shopId,
        quantity: 1
      }
      cartItems.value.push(newItem)
    }
  }

  const removeItem = (itemId: number) => {
    const index = cartItems.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      cartItems.value.splice(index, 1)
    }
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    const item = cartItems.value.find(item => item.id === itemId)
    if (item) {
      if (quantity <= 0) {
        removeItem(itemId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    cartItems.value = []
  }

  const getItemById = (itemId: number) => {
    return cartItems.value.find(item => item.id === itemId)
  }

  const setItems = (items: CartItem[]) => {
    cartItems.value = items
  }

  return {
    items,
    totalCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemById,
    setItems
  }
}
