// 首页API接口
import { http } from '@/utils/request'
import type { Category, CarouselItem, Shop, Dish } from '@/types'
import { CUSTOMER_API } from './paths'

// 分类相关API
export const categoryApi = {
  async getList(): Promise<Category[]> {
    return await http.get<Category[]>(CUSTOMER_API.CATEGORY_LIST, undefined, { skipAuth: true })
  }
}

// 轮播图相关API
export const carouselApi = {
  async getList(): Promise<CarouselItem[]> {
    return await http.get<CarouselItem[]>(CUSTOMER_API.BANNER_LIST, undefined, { skipAuth: true })
  }
}

// 店铺相关API
export const shopApi = {
  async getList(params?: { tagId?: number; page?: number; pageSize?: number }): Promise<{ list: Shop[]; total: number }> {
    const result = await http.get<{ records: Shop[]; total: number }>(CUSTOMER_API.SHOP_LIST, params, { skipAuth: true })
    return {
      list: result.records,
      total: result.total
    }
  },

  async search(keyword: string): Promise<Shop[]> {
    return await http.get<Shop[]>(CUSTOMER_API.SHOP_SEARCH, { keyword }, { skipAuth: true })
  }
}

// 菜品推荐API
export const dishApi = {
  async getRecommend(params?: { limit?: number }): Promise<Dish[]> {
    return await http.get<Dish[]>(CUSTOMER_API.DISH_RECOMMEND, params, { skipAuth: true })
  }
}