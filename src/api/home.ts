// 首页API接口
import { http } from '@/utils/request'
import type { Category, CarouselItem, Shop, Dish } from '@/types'
import { CUSTOMER_API } from './paths'

// 分类相关API
export const categoryApi = {
  // 获取分类列表
  async getList(): Promise<Category[]> {
    return await http.get<Category[]>(CUSTOMER_API.CATEGORY_LIST)
  }
}

// 轮播图相关API
export const carouselApi = {
  // 获取轮播图列表
  async getList(): Promise<CarouselItem[]> {
    return await http.get<CarouselItem[]>(CUSTOMER_API.BANNER_LIST)
  }
}

// 店铺相关API
export const shopApi = {
  // 获取店铺列表
  async getList(params?: { categoryId?: number; page?: number; pageSize?: number }): Promise<{ list: Shop[]; total: number }> {
    return await http.get<{ list: Shop[]; total: number }>(CUSTOMER_API.SHOP_LIST, params)
  },

  // 搜索店铺
  async search(keyword: string): Promise<Shop[]> {
    return await http.get<Shop[]>(CUSTOMER_API.SHOP_SEARCH, { keyword })
  }
}

// 菜品推荐API
export const dishApi = {
  // 获取推荐菜品
  async getRecommend(params?: { limit?: number }): Promise<Dish[]> {
    return await http.get<Dish[]>(CUSTOMER_API.DISH_RECOMMEND, params)
  }
}