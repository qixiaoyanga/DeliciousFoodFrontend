// 地址管理API接口
import { http } from '@/utils/request'
import { CUSTOMER_API } from './paths'

export interface Address {
  id: number
  userId?: number
  consignee: string
  phone: string
  province?: string
  city?: string
  district?: string
  detail: string
  longitude?: number
  latitude?: number
  label?: string
  defaulted?: number
}

export const addressApi = {
  // 获取地址列表
  async getList(): Promise<Address[]> {
    return await http.get<Address[]>(CUSTOMER_API.ADDRESS_LIST)
  },

  // 添加地址
  async add(data: Omit<Address, 'id'>): Promise<Address> {
    return await http.post<Address>(CUSTOMER_API.ADDRESS_ADD, data)
  },

  // 更新地址
  async update(id: number, data: Partial<Address>): Promise<void> {
    await http.post(CUSTOMER_API.ADDRESS_UPDATE(id), data)
  },

  // 删除地址
  async delete(id: number): Promise<void> {
    await http.post(CUSTOMER_API.ADDRESS_DELETE(id))
  },

  // 设为默认地址
  async setDefault(id: number): Promise<void> {
    await http.post(CUSTOMER_API.ADDRESS_SET_DEFAULT(id))
  }
}