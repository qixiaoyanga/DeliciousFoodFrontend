// 商家端API接口（预留）
// 商家端后续开发时可参考用户端实现

import { http } from '@/utils/request'
import { MERCHANT_API } from './paths'
import type { Shop, Dish } from '@/types'

// 商家端认证API（预留）
export const merchantApi = {
  // 商家登录
  login: (data: { username: string; password: string }) => {
    return http.post<{ accessToken: string; merchant: any }>(MERCHANT_API.MERCHANT_LOGIN, data)
  },

  // 商家注册
  register: (data: any) => {
    return http.post(MERCHANT_API.MERCHANT_REGISTER, data)
  },

  // 刷新Token
  refresh: (data: { fingerprint: string }) => {
    return http.post(MERCHANT_API.MERCHANT_REFRESH, data)
  },

  // 退出登录
  logout: () => {
    return http.post(MERCHANT_API.MERCHANT_LOGOUT)
  }
}

// 商家端店铺管理API
export const merchantShopApi = {
  // 获取店铺信息
  getInfo: () => {
    return http.get(MERCHANT_API.SHOP_MANAGE_INFO)
  },

  // 更新店铺信息
  update: (data: Partial<Shop>) => {
    return http.put(MERCHANT_API.SHOP_MANAGE_UPDATE, data)
  }
}

// 商家端菜品管理API
export const merchantDishApi = {
  // 获取菜品列表
  getList: (params?: any) => {
    return http.get(MERCHANT_API.DISH_MANAGE_LIST, params)
  },

  // 添加菜品
  add: (data: Partial<Dish>) => {
    return http.post(MERCHANT_API.DISH_MANAGE_ADD, data)
  },

  // 更新菜品
  update: (id: number, data: Partial<Dish>) => {
    return http.put(MERCHANT_API.DISH_MANAGE_UPDATE(id), data)
  },

  // 删除菜品
  delete: (id: number) => {
    return http.delete(MERCHANT_API.DISH_MANAGE_DELETE(id))
  },

  // 更新菜品状态
  updateStatus: (id: number, status: number) => {
    return http.put(MERCHANT_API.DISH_MANAGE_STATUS(id), { status })
  }
}

// 商家端订单管理API
export const merchantOrderApi = {
  // 获取订单列表
  getList: (params?: any) => {
    return http.get(MERCHANT_API.ORDER_MANAGE_LIST, params)
  },

  // 获取订单详情
  getDetail: (id: number) => {
    return http.get(MERCHANT_API.ORDER_MANAGE_DETAIL(id))
  },

  // 接单
  accept: (id: number) => {
    return http.post(MERCHANT_API.ORDER_MANAGE_ACCEPT(id))
  },

  // 拒单
  reject: (id: number, reason?: string) => {
    return http.post(MERCHANT_API.ORDER_MANAGE_REJECT(id), { reason })
  },

  // 完成订单
  complete: (id: number) => {
    return http.post(MERCHANT_API.ORDER_MANAGE_COMPLETE(id))
  }
}

export default {
  auth: merchantApi,
  shop: merchantShopApi,
  dish: merchantDishApi,
  order: merchantOrderApi
}
