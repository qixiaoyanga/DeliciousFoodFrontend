// 骑手端API接口

import { http } from '@/utils/request'
import { DELIVERY_API } from './paths'
import type { DeliveryInfo, DeliveryOrder, DeliveryDashboard, DeliveryLoginInfo } from '@/types'

// 骑手端认证API
export const deliveryAuthApi = {
  // 骑手登录
  login: (data: { phone?: string; email?: string; encryptedData: string; timestamp: string; nonce: string }) => {
    return http.post<DeliveryLoginInfo>(DELIVERY_API.DELIVERY_LOGIN, data)
  },

  // 骑手注册
  register: (data: { phone: string; email: string; realName: string; idCard: string; encryptedData: string; timestamp: string; nonce: string }) => {
    return http.post(DELIVERY_API.DELIVERY_REGISTER, data)
  },

  // 骑手登出
  logout: () => {
    return http.post(DELIVERY_API.DELIVERY_LOGOUT)
  }
}

// 骑手端订单API
export const deliveryOrderApi = {
  // 获取可接订单
  getAvailable: () => {
    return http.get<DeliveryOrder[]>(DELIVERY_API.DELIVERY_ORDER_AVAILABLE)
  },

  // 接单
  accept: (id: number) => {
    return http.post(DELIVERY_API.DELIVERY_ORDER_ACCEPT(id))
  },

  // 完成配送
  complete: (id: number) => {
    return http.post(DELIVERY_API.DELIVERY_ORDER_COMPLETE(id))
  },

  // 我的配送列表
  getMyOrders: () => {
    return http.get<DeliveryOrder[]>(DELIVERY_API.DELIVERY_ORDER_LIST)
  }
}

// 骑手端个人信息API
export const deliveryInfoApi = {
  // 获取个人信息
  getInfo: () => {
    return http.get<DeliveryInfo>(DELIVERY_API.DELIVERY_INFO)
  },

  // 更新个人信息
  update: (data: { realName?: string; email?: string; idCard?: string }) => {
    return http.post(DELIVERY_API.DELIVERY_INFO_UPDATE, data)
  },

  // 获取数据看板
  getDashboard: () => {
    return http.get<DeliveryDashboard>(DELIVERY_API.DELIVERY_DASHBOARD)
  }
}

export default {
  auth: deliveryAuthApi,
  order: deliveryOrderApi,
  info: deliveryInfoApi
}
