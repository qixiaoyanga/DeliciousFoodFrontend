// 用户API接口
import { http } from '@/utils/request'
import type { User } from '@/types'
import { CUSTOMER_API } from './paths'

// 用户信息API
export const userApi = {
  // 获取用户信息
  async getInfo(): Promise<User> {
    return await http.get<User>(CUSTOMER_API.USER_INFO)
  },

  // 更新用户信息
  async updateInfo(data: Partial<User>): Promise<User> {
    return await http.put<User>(CUSTOMER_API.USER_UPDATE, data)
  },

  // 获取当前用户信息
  async getCurrent(): Promise<User> {
    return await http.get<User>(CUSTOMER_API.USER_CURRENT)
  }
}