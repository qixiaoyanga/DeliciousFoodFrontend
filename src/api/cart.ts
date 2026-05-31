// 购物车API接口
import { http } from '@/utils/request'
import { CUSTOMER_API } from './paths'

// 购物车相关API
export const cartApi = {
  // 获取购物车
  async get(): Promise<any[]> {
    return await http.get<any[]>(CUSTOMER_API.CART_GET)
  },

  // 添加购物车
  async add(data: { dishId: number; quantity: number }): Promise<void> {
    await http.post(CUSTOMER_API.CART_ADD, data)
  },

  // 更新购物车
  async update(data: { dishId: number; quantity: number }): Promise<void> {
    await http.put(CUSTOMER_API.CART_UPDATE, data)
  },

  // 删除购物车项
  async remove(dishId: number): Promise<void> {
    await http.delete(CUSTOMER_API.CART_REMOVE, { dishId })
  },

  // 清空购物车
  async clear(): Promise<void> {
    await http.post(CUSTOMER_API.CART_CLEAR)
  }
}