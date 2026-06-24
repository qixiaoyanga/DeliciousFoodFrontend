// API路径常量定义
// 用于统一管理不同端的API路径前缀

// 用户端API前缀
export const API_PREFIX_CUSTOMER = '/customer'

// 商家端API前缀
export const API_PREFIX_MERCHANT = '/merchant'

// 管理端API前缀
export const API_PREFIX_ADMIN = '/admin'

// 公共API前缀（不需要认证的）
export const API_PREFIX_PUBLIC = '/public'

// ==================== 用户端API路径 ====================

// 认证相关
export const CUSTOMER_API = {
  // 认证
  PUBLIC_KEY: `${API_PREFIX_PUBLIC}/public-key`,
  LOGIN: `${API_PREFIX_CUSTOMER}/login`,
  REGISTER: `${API_PREFIX_CUSTOMER}/register`,
  REFRESH: `${API_PREFIX_CUSTOMER}/refresh`,
  LOGOUT: `${API_PREFIX_CUSTOMER}/logout`,

  // 找回密码
  FORGOT_PASSWORD_SEND_CODE: `${API_PREFIX_PUBLIC}/forgot-password/send-code`,
  FORGOT_PASSWORD_VERIFY_CODE: `${API_PREFIX_PUBLIC}/forgot-password/verify-code`,
  FORGOT_PASSWORD_RESET: `${API_PREFIX_PUBLIC}/forgot-password/reset`,

  // 用户
  USER_CURRENT: `${API_PREFIX_CUSTOMER}/user/current`,
  USER_INFO: `${API_PREFIX_CUSTOMER}/user/info`,
  USER_UPDATE: `${API_PREFIX_CUSTOMER}/user/update`,
  USER_CHANGE_PASSWORD: `${API_PREFIX_CUSTOMER}/user/change-password`,
  USER_REAL_NAME: `${API_PREFIX_CUSTOMER}/user/real-name`,
  USER_REAL_NAME_UPDATE: `${API_PREFIX_CUSTOMER}/user/real-name/update`,
  USER_AVATAR_UPLOAD: `${API_PREFIX_CUSTOMER}/user/avatar/upload`,

  // 店铺
  SHOP_LIST: `${API_PREFIX_CUSTOMER}/shop/list`,
  SHOP_DETAIL: (id: number) => `${API_PREFIX_CUSTOMER}/shop/${id}`,
  SHOP_SEARCH: `${API_PREFIX_CUSTOMER}/shop/search`,
  SHOP_DISHES: (id: number) => `${API_PREFIX_CUSTOMER}/shop/${id}/dishes`,

  // 菜品
  DISH_DETAIL: (id: number) => `${API_PREFIX_CUSTOMER}/dish/${id}`,
  DISH_RECOMMEND: `${API_PREFIX_CUSTOMER}/dish/recommend`,
  DISH_CATEGORY: (id: number) => `${API_PREFIX_CUSTOMER}/dish/category/${id}`,

  // 分类
  CATEGORY_LIST: `${API_PREFIX_CUSTOMER}/category/list`,

  // 轮播图
  BANNER_LIST: `${API_PREFIX_CUSTOMER}/banner/list`,

  // 订单
  ORDER_CREATE: `${API_PREFIX_CUSTOMER}/order/create`,
  ORDER_LIST: `${API_PREFIX_CUSTOMER}/order/list`,
  ORDER_DETAIL: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}`,
  ORDER_CANCEL: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/cancel`,
  ORDER_CONFIRM: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/confirm`,
  ORDER_PAY: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/pay`,
  ORDER_UPDATE_ADDRESS: `${API_PREFIX_CUSTOMER}/order/updateAddress`,
  ORDER_UPDATE_REMARK: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/remark`,
  ORDER_UPDATE_PAYTYPE: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/paytype`,
  ORDER_DELETE: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/delete`,
  ORDER_DELIVERY: (id: number) => `${API_PREFIX_CUSTOMER}/order/${id}/delivery`,

  // 支付相关
  PAY_WECHAT: `${API_PREFIX_CUSTOMER}/wechat/pay`,
  PAY_ALIPAY: `${API_PREFIX_CUSTOMER}/alipay/pay`,
  PAY_WALLET: `${API_PREFIX_CUSTOMER}/wallet/pay`,

  // 购物车
  CART_GET: `${API_PREFIX_CUSTOMER}/cart`,
  CART_ADD: `${API_PREFIX_CUSTOMER}/cart/add`,
  CART_UPDATE: `${API_PREFIX_CUSTOMER}/cart/update`,
  CART_UPDATE_QUANTITY: `${API_PREFIX_CUSTOMER}/cart/quantity`,
  CART_REMOVE: `${API_PREFIX_CUSTOMER}/cart/remove`,
  CART_CLEAR: `${API_PREFIX_CUSTOMER}/cart/clear`,

  // 地址
  ADDRESS_LIST: `${API_PREFIX_CUSTOMER}/address/list`,
  ADDRESS_ADD: `${API_PREFIX_CUSTOMER}/address/add`,
  ADDRESS_UPDATE: (id: number) => `${API_PREFIX_CUSTOMER}/address/${id}`,
  ADDRESS_DELETE: (id: number) => `${API_PREFIX_CUSTOMER}/address/${id}/delete`,
  ADDRESS_SET_DEFAULT: (id: number) => `${API_PREFIX_CUSTOMER}/address/${id}/default`
} as const

// ==================== 商家端API路径（预留） ====================

export const MERCHANT_API = {
  // 认证
  MERCHANT_LOGIN: `${API_PREFIX_MERCHANT}/login`,
  MERCHANT_REFRESH: `${API_PREFIX_MERCHANT}/refresh`,
  MERCHANT_REGISTER: `${API_PREFIX_MERCHANT}/register`,
  MERCHANT_LOGOUT: `${API_PREFIX_MERCHANT}/logout`,

  // 商家信息
  MERCHANT_INFO: `${API_PREFIX_MERCHANT}/merchant/info`,
  MERCHANT_UPDATE: `${API_PREFIX_MERCHANT}/merchant/update`,

  // 店铺管理
  SHOP_MANAGE_INFO: `${API_PREFIX_MERCHANT}/shop/info`,
  SHOP_MANAGE_UPDATE: `${API_PREFIX_MERCHANT}/shop/update`,
  SHOP_MANAGE_UPLOAD_LOGO: `${API_PREFIX_MERCHANT}/shop/upload/logo`,
  SHOP_MANAGE_UPLOAD_BUSINESS_LICENSE: `${API_PREFIX_MERCHANT}/shop/upload/businessLicense`,
  SHOP_MANAGE_UPLOAD_FOOD_LICENSE: `${API_PREFIX_MERCHANT}/shop/upload/foodLicense`,

  // 菜品管理
  DISH_MANAGE_LIST: `${API_PREFIX_MERCHANT}/dish/list`,
  DISH_MANAGE_ADD: `${API_PREFIX_MERCHANT}/dish/add`,
  DISH_MANAGE_UPDATE: `${API_PREFIX_MERCHANT}/dish/update`,
  DISH_MANAGE_DELETE: `${API_PREFIX_MERCHANT}/dish/delete`,
  DISH_MANAGE_STATUS: `${API_PREFIX_MERCHANT}/dish/status`,
  DISH_MANAGE_UPLOAD: `${API_PREFIX_MERCHANT}/dish/upload`,

  // 分类管理
  CATEGORY_MANAGE_LIST: `${API_PREFIX_MERCHANT}/category/list`,
  CATEGORY_MANAGE_ADD: `${API_PREFIX_MERCHANT}/category/add`,
  CATEGORY_MANAGE_UPDATE: `${API_PREFIX_MERCHANT}/category/update`,
  CATEGORY_MANAGE_DELETE: `${API_PREFIX_MERCHANT}/category/delete`,

  // 订单管理
  ORDER_MANAGE_LIST: `${API_PREFIX_MERCHANT}/order/list`,
  ORDER_MANAGE_DETAIL: (id: number) => `${API_PREFIX_MERCHANT}/order/${id}`,
  ORDER_MANAGE_ACCEPT: (orderNo: string | number) => `${API_PREFIX_MERCHANT}/order/${orderNo}/accept`,
  ORDER_MANAGE_REJECT: (orderNo: string | number) => `${API_PREFIX_MERCHANT}/order/${orderNo}/reject`,
  ORDER_MANAGE_COMPLETE: (orderNo: string | number) => `${API_PREFIX_MERCHANT}/order/${orderNo}/complete`,

  DASHBOARD_INFO: `${API_PREFIX_MERCHANT}/dashboard/info`
} as const

// ==================== 管理端API路径（预留） ====================

export const ADMIN_API = {
  // 认证
  ADMIN_LOGIN: `${API_PREFIX_ADMIN}/login`,
  ADMIN_LOGOUT: `${API_PREFIX_ADMIN}/logout`,

  // 数据看板
  ADMIN_DASHBOARD: `${API_PREFIX_ADMIN}/dashboard`,

  // 用户管理
  USER_ADMIN_LIST: `${API_PREFIX_ADMIN}/user/list`,
  USER_ADMIN_STATUS: `${API_PREFIX_ADMIN}/user/status`,
  USER_ADMIN_PROFILE: (id: string | number) => `${API_PREFIX_ADMIN}/user/${id}/profile`,

  // 商家管理
  SHOP_ADMIN_LIST: `${API_PREFIX_ADMIN}/shop/list`,
  SHOP_ADMIN_DETAIL: (id: string | number) => `${API_PREFIX_ADMIN}/shop/${id}`,
  SHOP_ADMIN_AUDIT: (id: string | number) => `${API_PREFIX_ADMIN}/shop/${id}/audit`,
  SHOP_ADMIN_STATUS: (id: string | number) => `${API_PREFIX_ADMIN}/shop/${id}/status`,

  // 骑手管理
  DELIVERY_ADMIN_LIST: `${API_PREFIX_ADMIN}/delivery/list`,
  DELIVERY_ADMIN_STATUS: (id: string | number) => `${API_PREFIX_ADMIN}/delivery/${id}/status`
} as const

// ==================== 骑手端API路径 ====================

export const DELIVERY_API = {
  // 认证
  DELIVERY_LOGIN: `/delivery/login`,
  DELIVERY_REGISTER: `/delivery/register`,
  DELIVERY_LOGOUT: `/delivery/logout`,

  // 订单
  DELIVERY_ORDER_AVAILABLE: `/delivery/order/available`,
  DELIVERY_ORDER_ACCEPT: (id: number) => `/delivery/order/${id}/accept`,
  DELIVERY_ORDER_COMPLETE: (id: number) => `/delivery/order/${id}/complete`,
  DELIVERY_ORDER_LIST: `/delivery/order/list`,

  // 个人信息
  DELIVERY_INFO: `/delivery/info`,
  DELIVERY_INFO_UPDATE: `/delivery/info/update`,
  DELIVERY_DASHBOARD: `/delivery/dashboard`
} as const

export default {
  CUSTOMER: CUSTOMER_API,
  MERCHANT: MERCHANT_API,
  ADMIN: ADMIN_API,
  DELIVERY: DELIVERY_API,
  PREFIX: {
    CUSTOMER: API_PREFIX_CUSTOMER,
    MERCHANT: API_PREFIX_MERCHANT,
    ADMIN: API_PREFIX_ADMIN,
    PUBLIC: API_PREFIX_PUBLIC
  }
}
