// 订单页API接口
import { http } from '@/utils/request'
import { CUSTOMER_API } from './paths'
import { getAccessToken } from '@/utils/token'

// 订单相关API
export const orderApi = {
  // 创建订单
  async create(data: {
    cartIds: number[]
    address?: string
    addressName?: string
    addressPhone?: string
    remark?: string
    payType?: number
  }): Promise<any> {
    return await http.post<any>(CUSTOMER_API.ORDER_CREATE, data)
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
  async pay(data: {
    orderNo: number
    payType: number
    address?: any
    remark?: string
  }): Promise<{ payUrl?: string }> {
    return await http.post<{ payUrl?: string }>(CUSTOMER_API.ORDER_PAY(data.orderNo), data)
  },

  // 更新订单地址
  async updateAddress(data: { orderNo: number; addressId: number }): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_UPDATE_ADDRESS, data)
  },

  // 更新订单备注
  async updateRemark(id: number, data: { remark: string }): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_UPDATE_REMARK(id), data)
  },

  // 更新支付方式
  async updatePayType(id: number, data: { payType: number }): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_UPDATE_PAYTYPE(id), data)
  },

  // 微信支付
  async wechatPay(orderNo: number): Promise<any> {
    return await http.post<any>(CUSTOMER_API.PAY_WECHAT, { orderNo })
  },

  // 支付宝支付 - 返回原始HTML文本
  async alipayPay(orderNo: number): Promise<string> {
    // 直接使用fetch获取原始HTML响应
    const token = getAccessToken()
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    const response = await fetch(`${baseUrl}${CUSTOMER_API.PAY_ALIPAY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token || ''
      },
      credentials: 'include',
      body: JSON.stringify({ orderNo })
    })
    return await response.text()
  },

  // 钱包支付
  async walletPay(data: { orderNo: number; password: string }): Promise<any> {
    return await http.post<any>(CUSTOMER_API.PAY_WALLET, data)
  },

  // 删除订单
  async delete(id: number): Promise<void> {
    await http.post(CUSTOMER_API.ORDER_DELETE(id))
  },

  // 查询配送信息
  async getDelivery(id: number): Promise<{
    riderName?: string
    riderPhone?: string
    deliveryStatus?: number
    deliveryStatusText?: string
    estimatedTime?: string
    deliveryAddress?: string
    currentLocation?: { lat: number; lng: number }
    traceList?: Array<{ time: string; description: string }>
  }> {
    return await http.get<any>(CUSTOMER_API.ORDER_DELIVERY(id))
  }
}
