// 用户API接口
import { http } from '@/utils/request'
import type { User } from '@/types'
import { CUSTOMER_API } from './paths'

export interface UpdatePasswordParams {
  oldEncryptedData: string
  newEncryptedData: string
  timestamp: string
  nonce: string
}

export interface RealNameInfo {
  realName: string
  idCard: string
}

// 用户信息API
export const userApi = {
  // 获取用户信息
  async getInfo(): Promise<User> {
    return await http.get<User>(CUSTOMER_API.USER_INFO)
  },

  // 更新用户信息
  async updateInfo(data: Partial<User>): Promise<User> {
    return await http.post<User>(CUSTOMER_API.USER_UPDATE, data)
  },

  // 修改密码
  async updatePassword(data: UpdatePasswordParams): Promise<void> {
    return await http.post<void>(CUSTOMER_API.USER_CHANGE_PASSWORD, data)
  },

  // 获取当前用户信息
  async getCurrent(): Promise<User> {
    return await http.get<User>(CUSTOMER_API.USER_CURRENT)
  },

  // 获取实名信息
  async getRealName(): Promise<RealNameInfo> {
    return await http.get<RealNameInfo>(CUSTOMER_API.USER_REAL_NAME)
  },

  // 提交实名认证
  async submitRealName(data: RealNameInfo): Promise<void> {
    return await http.post<void>(CUSTOMER_API.USER_REAL_NAME_UPDATE, data)
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    return await http.post<string>(CUSTOMER_API.USER_AVATAR_UPLOAD, formData, {
      headers: {}
    })
  }
}