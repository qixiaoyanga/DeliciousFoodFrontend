export interface Shop {
  id: number
  name: string
  logo: string
  description?: string
  businessLicense?: string
  foodLicense?: string
  legalPersonName?: string
  legalPersonIdCard?: string
  shopFrontImg?: string
  shopInteriorImg?: string
  longitude?: number
  latitude?: number
  province?: string
  city?: string
  district?: string
  address?: string
  businessHours?: string
  radius?: number
  delivery: number
  minOrderAmount: number
  auditStatus?: number
  rejectReason?: string | null
  status: number
  sort?: number
  grade: number
  monthlySales: number
  totalSales?: number
  tags?: number
  ownerId?: number
  shopStatus?: number
  createTime?: string
  updateTime?: string
}

export interface DishSpec {
  id?: number
  dishId: number
  name: string
  price: number
  stock: number
  status: number
  createTime: string
}

export interface AttributeOption {
  id: number
  attributeId: number
  name: string
  priceModifier: number
  stock: number
  createTime: string
}

export interface DishAttribute {
  id: number
  dishId: number
  name: string
  required: number
  maxSelect: number
  status: number
  createTime: string
  options: AttributeOption[]
}

export interface DishCategory {
  id: number
  shopId: number
  name: string
  sort: number
  status: number
  createTime: string
}

export interface Dish {
  id: number
  shopId: number
  categoryId: number
  category?: DishCategory
  name: string
  image: string
  description?: string
  price: number
  salesPrice: number
  boxPrice: number
  stock: number
  status: number
  sales: number
  monthSales: number
  recommend: number
  createTime: string
  updateTime: string
  specs?: DishSpec[]
  attributes?: DishAttribute[]
}

export interface Category {
  id: number
  name: string
  icon?: string
  count?: number
}

export interface CartItemAttributeOption {
  id: number
  name: string
  priceModifier: number
}

export interface CartItem {
  id: number
  dishId: number
  name: string
  price: number
  salesPrice: number
  image: string
  shopId: number
  shopName?: string
  shopDelivery?: number
  quantity: number
  specName?: string
  boxPrice?: number
  totalPrice?: number
  attributeOptions?: CartItemAttributeOption[]
  selected?: boolean
}

export interface CartState {
  items: CartItem[]
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
  uid: string
  username: string
  phone: string
  email?: string
  image?: string
  gender?: number
  createTime?: string
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
  skipAuth?: boolean
}

// 响应状态类型
export interface ResponseState {
  loading: boolean
  error: string | null
  data: any
}

export interface DashboardInfo {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  todayOrders: number
  todayRevenue: number
  weekOrders: number[]
  weekRevenue: number[]
  monthOrders: number[]
  monthRevenue: number[]
  categoryStats: { name: string; value: number }[]
  topDishes: { name: string; sales: number; revenue: number }[]
  shopName: string
  shopImage: string
}

// ==================== 管理端类型 ====================

export interface AdminUser {
  uid: string
  username: string
  phone: string
  email: string
  image: string | null
  gender: number
  realName: string | null
  memberLevel: number
  balance: number
  status: number
  registerTime: string
  lastLoginTime: string | null
}

export interface AdminShop {
  id: string
  name: string
  logo: string
  description: string
  businessLicense: string | null
  foodLicense: string | null
  ownerName: string
  ownerPhone: string
  auditStatus: number
  rejectReason: string | null
  status: number
  shopStatus: number
  province: string
  city: string
  district: string
  address: string
  grade: number
  monthlySales: number
  createTime: string
}

export interface AdminOrder {
  id: number
  orderNo: string | number
  userName: string
  userPhone: string
  shopName: string
  totalAmount: number
  deliveryFee: number
  actualAmount: number
  payMethod: number
  status: number
  deliveryName: string | null
  remark: string | null
  createTime: string
  payTime: string | null
}

export interface AdminDelivery {
  id: string
  realName: string
  phone: string
  email: string
  idCard: string
  balance: number
  status: number
  registerTime: string
  lastLoginTime: string | null
}

export interface AdminDashboard {
  totalUsers: string
  totalMerchants: string
  totalOrders: string
  totalRevenue: number
  todayNewUsers: string
  todayNewOrders: string
  pendingAuditShops: string
  userGrowth: string[]
  orderTrend: string[]
  weekLabels: string[]
}

export interface AdminLoginInfo {
  accessToken: string
  id: string
  username: string
  role: number
  phone: string
}

export interface PageVO<T> {
  records: T[]
  total: string
  pages: string
  current: string
  size: string
}

// ==================== 骑手端类型 ====================

export interface DeliveryInfo {
  id: string
  phone: string
  email: string
  realName: string
  idCard: string
  balance: number
  status: number
  registerTime: string
  lastLoginTime: string | null
}

export interface DeliveryOrder {
  id: number
  orderNo: number
  consignee: string
  consigneePhone: string
  fullAddress: string
  pickupCode: string | null
  shopName: string
  shopAddress: string
  deliveryFee: number
  actualAmount: number
  status: number
  remark: string | null
  createTime: string
}

export interface DeliveryDashboard {
  todayCompleted: number
  todayIncome: number
  totalCompleted: number
  totalIncome: number
  pendingOrders: number
  deliveringOrders: number
  weekCompleted: number[]
  weekIncome: number[]
  weekLabels: string[]
}

export interface DeliveryLoginInfo {
  accessToken: string
  id: string
  phone: string
  realName: string
}

// ==================== 用户画像类型 ====================

export interface UserProfile {
  id: number
  userId: number
  totalOrders: number
  totalAmount: number
  avgOrderAmount: number
  maxOrderAmount: number
  minOrderAmount: number
  monthlyOrders: number
  weeklyOrders: number
  lastOrderTime: string | null
  daysSinceLastOrder: number
  breakfastRatio: number
  lunchRatio: number
  dinnerRatio: number
  nightSnackRatio: number
  weekdayRatio: number
  weekendRatio: number
  favoriteCategories: string | null
  favoriteDishes: string | null
  favoriteShops: string | null
  spicyPreference: number
  sweetPreference: number
  avgDeliveryTime: number
  cancelRate: number
  commentRate: number
  refundRate: number
  consumptionLevel: string
  frequencyLevel: string
  userTags: string | null
  recencyScore: number
  frequencyScore: number
  monetaryScore: number
  rfmSegment: string
  firstOrderTime: string | null
}
