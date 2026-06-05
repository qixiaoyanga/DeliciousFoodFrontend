// 购物车API接口
import { http } from '@/utils/request'
import { CUSTOMER_API } from './paths'

// 购物车项参数
export interface CartItemParams {
  shopId: number
  dishId: number
  quantity: number
  specId?: number
  attributeOptionIds?: number[]
}

// 更新数量参数
export interface UpdateQuantityParams {
  id: number
  quantity: number
}

// 删除商品参数
export interface RemoveItemParams {
  cartIds: number[]
}

// 购物车相关API
export const cartApi = {
  // 获取购物车
  async get(): Promise<any[]> {
    return await http.get<any[]>(CUSTOMER_API.CART_GET)
  },

  // 添加购物车
  async add(data: CartItemParams): Promise<void> {
    await http.post(CUSTOMER_API.CART_ADD, data)
  },

  // 更新购物车
  async update(data: CartItemParams): Promise<void> {
    await http.post(CUSTOMER_API.CART_UPDATE, data)
  },

  // 更新数量
  async updateQuantity(data: UpdateQuantityParams): Promise<void> {
    await http.post(CUSTOMER_API.CART_UPDATE_QUANTITY, data)
  },

  // 删除购物车项
  async remove(data: RemoveItemParams): Promise<void> {
    await http.post(CUSTOMER_API.CART_REMOVE, data)
  },

  // 清空购物车
  async clear(cartIds: number[]): Promise<void> {
    await http.post(CUSTOMER_API.CART_REMOVE, { cartIds })
  }
}