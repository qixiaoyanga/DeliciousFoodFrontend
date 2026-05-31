// 店铺页API接口
import { http } from '@/utils/request'
import type { Shop, Dish } from '@/types'
import { CUSTOMER_API } from './paths'

// 店铺详情API
export const shopDetailApi = {
  // 获取店铺详情
  async getDetail(id: number): Promise<Shop> {
    return await http.get<Shop>(CUSTOMER_API.SHOP_DETAIL(id))
  }
}

// 店铺菜品API
export const shopDishApi = {
  // 获取店铺菜品
  async getDishes(shopId: number): Promise<Dish[]> {
    return await http.get<Dish[]>(CUSTOMER_API.SHOP_DISHES(shopId))
  },

  // 获取菜品详情
  async getDetail(id: number): Promise<Dish> {
    return await http.get<Dish>(CUSTOMER_API.DISH_DETAIL(id))
  },

  // 获取分类菜品
  async getByCategory(categoryId: number): Promise<Dish[]> {
    return await http.get<Dish[]>(CUSTOMER_API.DISH_CATEGORY(categoryId))
  }
}