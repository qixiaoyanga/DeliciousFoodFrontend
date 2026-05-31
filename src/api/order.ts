// 订单页API接口
import { http } from '@/utils/request'
import { CUSTOMER_API } from './paths'

// 订单相关API
export const orderApi = {
  // 创建订单
  async create(data: {
    shopId: number
    items: Array<{ dishId: number; quantity: number }>
    remark?: string
    address?: string
  }): Promise<{ orderId: number }> {
    return await http.post<{ orderId: number }>(CUSTOMER_API.ORDER_CREATE, data)
  },

  // 获取订单列表
  async getList(params?: { status?: number; page?: number; pageSize?: number }): Promise<{ list: any[]; total: number }> {
    return await http.get<{ list: any[]; total: number }>(CUSTOMER_API.ORDER_LIST, params)
  },

  // 获取订单详情
  async getDetail(id: number): Promise<any> {
    return await http.get<any>(CUSTOMER_API.ORDER_DETAIL(id))
  },

  // 取消订单
  async cancel(id: number): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_CANCEL(id))
  },

  // 确认收货
  async confirm(id: number): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_CONFIRM(id))
  },

  // 支付订单
  async pay(id: number): Promise<{ payUrl?: string }> {
    return await http.post<{ payUrl?: string }>(CUSTOMER_API.ORDER_PAY(id))
  }
}