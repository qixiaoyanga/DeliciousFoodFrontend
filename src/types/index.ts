export interface Shop {
  id: number
  name: string
  rating: number
  sales: number
  minimumOrder: number
  deliveryFee: number
  deliveryTime: string
  image: string
  categories: string[]
  description?: string
}

export interface Dish {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  sales: number
  rating: number
  shopId: number
  description?: string
}

export interface Category {
  id: number
  name: string
  icon: string
  count: number
}

export interface CarouselItem {
  id: number
  image: string
  link?: string
  title?: string
  subtitle?: string
}

export interface NavItem {
  path: string
  name: string
  icon?: string
}

export interface User {
  id: number
  phone: string
  nickname?: string
  avatar?: string
}

// 统一返回结果类（与后端对应）
export interface Result<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 状态码枚举
export enum ResultCodeEnum {
  SUCCESS = 200,
  ERROR = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  VALIDATION_ERROR = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// 请求配置类型
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: any
  headers?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
  signal?: AbortSignal
}

// 响应状态类型
export interface ResponseState {
  loading: boolean
  error: string | null
  data: any
}
