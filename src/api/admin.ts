// 管理端API接口

import { http } from '@/utils/request'
import { ADMIN_API } from './paths'
import type { AdminUser, AdminShop, AdminDelivery, AdminDashboard, AdminLoginInfo, PageVO } from '@/types'

// 管理端认证API
export const adminAuthApi = {
  // 管理员登录
  login: (data: { username: string; password: string }) => {
    return http.post<AdminLoginInfo>(ADMIN_API.ADMIN_LOGIN, data)
  },

  // 管理员登出
  logout: () => {
    return http.post(ADMIN_API.ADMIN_LOGOUT)
  }
}

// 管理端数据看板API
export const adminDashboardApi = {
  // 获取数据看板
  getInfo: () => {
    return http.get<AdminDashboard>(ADMIN_API.ADMIN_DASHBOARD)
  }
}

// 管理端用户管理API
export const adminUserApi = {
  // 获取用户列表
  getList: (params: { page: number; size: number; keyword?: string; status?: number }) => {
    return http.get<PageVO<AdminUser>>(ADMIN_API.USER_ADMIN_LIST, params)
  },

  // 切换用户状态（通过手机号）
  updateStatus: (phone: string, status: number) => {
    return http.put(ADMIN_API.USER_ADMIN_STATUS, { phone, status })
  }
}

// 管理端商家管理API
export const adminShopApi = {
  // 获取商家列表
  getList: (params: { page: number; size: number; keyword?: string; auditStatus?: number; shopStatus?: number }) => {
    return http.get<PageVO<AdminShop>>(ADMIN_API.SHOP_ADMIN_LIST, params)
  },

  // 获取商家详情
  getDetail: (id: number) => {
    return http.get<AdminShop>(ADMIN_API.SHOP_ADMIN_DETAIL(id))
  },

  // 审核商家
  audit: (id: number, data: { shopId: number; auditStatus: number; rejectReason?: string }) => {
    return http.put(ADMIN_API.SHOP_ADMIN_AUDIT(id), data)
  },

  // 切换商家状态
  updateStatus: (id: number, status: number) => {
    return http.put(ADMIN_API.SHOP_ADMIN_STATUS(id), { id, status })
  }
}

// 管理端骑手管理API
export const adminDeliveryApi = {
  // 获取骑手列表
  getList: (params: { page: number; size: number; keyword?: string; status?: number }) => {
    return http.get<PageVO<AdminDelivery>>(ADMIN_API.DELIVERY_ADMIN_LIST, params)
  },

  // 切换骑手状态
  updateStatus: (id: string | number, status: number) => {
    return http.put(ADMIN_API.DELIVERY_ADMIN_STATUS(id), { id, status })
  }
}

export default {
  auth: adminAuthApi,
  dashboard: adminDashboardApi,
  user: adminUserApi,
  shop: adminShopApi,
  delivery: adminDeliveryApi
}
