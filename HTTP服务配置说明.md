# HTTP请求服务配置说明

## 📦 新增文件列表

| 文件路径 | 说明 |
|---------|------|
| `src/utils/request.ts` | HTTP请求服务，包含拦截器 |
| `src/utils/toast.ts` | Toast提示工具导出 |
| `src/components/common/Toast.vue` | Toast提示组件 |
| `src/api/index.ts` | API接口定义 |
| `.env.example` | 环境变量示例 |
| `src/types/index.ts` (更新) | 类型定义（新增Result相关类型） |
| `src/App.vue` (更新) | 集成Toast组件 |
| `src/views/LoginView.vue` (更新) | 演示API使用 |

## 🎯 核心功能

### 1. 统一返回结果类型

```typescript
interface Result<T = any> {
  code: number      // 状态码
  message: string   // 返回消息
  data: T          // 返回数据
  timestamp: number // 时间戳
}

enum ResultCodeEnum {
  SUCCESS = 200,
  ERROR = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  BAD_REQUEST = 400
}
```

### 2. 请求拦截器

- ✅ 添加时间戳防缓存
- ✅ 自动添加认证token
- ✅ 取消重复请求
- ✅ 请求队列管理

### 3. 响应拦截器

- ✅ 统一处理Result响应
- ✅ 自动提取data数据
- ✅ 移除已完成请求

### 4. 错误拦截器

- ✅ 统一错误处理
- ✅ 超时处理
- ✅ 网络断开检测
- ✅ 请求取消处理
- ✅ Toast提示

### 5. Toast提示组件

- ✅ Success（绿色）
- ✅ Error（红色）
- ✅ Warning（黄色）
- ✅ Info（蓝色）
- ✅ 自动消失
- ✅ 动画效果

## 🚀 使用方法

### 基础HTTP请求

```typescript
import { http } from '@/utils/request'

// GET请求
http.get<User>('/user/info', { id: 1 })

// POST请求
http.post<Result>('/user/login', { phone: '13800138000', password: '123456' })

// PUT请求
http.put<User>('/user/info', { nickname: '新昵称' })

// DELETE请求
http.delete('/user/123')

// PATCH请求
http.patch('/user/123', { field: 'value' })
```

### 使用API接口

```typescript
import { userApi, shopApi, orderApi } from '@/api'

// 用户登录
const result = await userApi.login({
  phone: '13800138000',
  password: '123456'
})
// result: { token: string; user: User }

// 获取店铺列表
const { list, total } = await shopApi.getList({
  categoryId: 1,
  page: 1,
  pageSize: 20
})

// 创建订单
const { orderId } = await orderApi.create({
  shopId: 1,
  items: [
    { dishId: 1, quantity: 2 },
    { dishId: 3, quantity: 1 }
  ]
})
```

### Toast提示

```typescript
import { toast } from '@/utils/toast'

// 成功提示
toast.success('操作成功！')

// 错误提示
toast.error('登录失败，请重试')

// 警告提示
toast.warning('请注意！')

// 信息提示
toast.info('温馨提示')

// 自定义时长（毫秒）
toast.success('快速提示', 1500)
```

### 自定义请求配置

```typescript
import { http } from '@/utils/request'

// 不显示错误提示
const result = await http.get('/api/data', { id: 1 }, {
  showError: false
})

// 自定义请求头
await http.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 自定义超时
await http.get('/api/slow', {}, {
  timeout: 60000
})
```

### 取消请求

```typescript
import { http } from '@/utils/request'

// 取消特定请求
http.cancel({
  url: '/api/data',
  method: 'GET',
  params: { id: 1 }
})

// 取消所有请求
http.cancelAll()
```

## 📝 请求配置类型

```typescript
interface RequestConfig {
  url: string                              // 请求地址
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'  // 请求方法
  data?: any                               // 请求体（非GET）
  params?: any                             // 查询参数
  headers?: Record<string, string>         // 请求头
  timeout?: number                         // 超时时间（默认30秒）
  showLoading?: boolean                   // 是否显示loading（暂未实现）
  showError?: boolean                     // 是否显示错误提示（默认true）
}
```

## 🔧 环境配置

### 开发环境

复制 `.env.example` 为 `.env` 文件并配置：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 生产环境

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## 📐 设计特点

1. **零依赖**：使用原生Fetch API，无需axios等第三方库
2. **类型安全**：完整的TypeScript类型定义
3. **自动Token**：自动从localStorage读取token并添加到请求头
4. **错误提示**：统一的Toast错误提示，无需手动处理
5. **防重复请求**：自动取消相同请求
6. **超时处理**：支持自定义超时时间
7. **取消请求**：支持取消特定请求或全部请求

## 🎨 Toast组件使用

在项目中已自动集成到App.vue，无需额外配置：

```vue
<!-- App.vue中已自动引入 -->
<Toast ref="toastRef" />
```

样式特点：
- 右侧弹出式设计
- 左侧颜色条区分类型
- 点击×号关闭
- 响应式布局
- 平滑动画

## 🔐 Token管理

```typescript
// 登录成功后存储Token
localStorage.setItem('token', response.token)

// 退出登录清除Token
localStorage.removeItem('token')

// 读取Token（请求拦截器自动读取）
const token = localStorage.getItem('token')
```

## 💡 完整示例

### 登录页面（已更新）

```typescript
import { userApi } from '@/api'
import { toast } from '@/utils/toast'

const handleLogin = async () => {
  try {
    const result = await userApi.login({
      phone: phone.value,
      password: password.value
    })
    
    localStorage.setItem('token', result.token)
    toast.success('登录成功！')
    router.push('/')
  } catch (error) {
    // 错误已自动通过toast提示，此处可添加其他处理
    console.error('登录失败:', error)
  }
}
```

### 店铺列表页面

```typescript
import { ref, onMounted } from 'vue'
import { shopApi } from '@/api'
import { toast } from '@/utils/toast'

const shops = ref<Shop[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { list } = await shopApi.getList({
      categoryId: 1,
      page: 1,
      pageSize: 20
    })
    shops.value = list
  } finally {
    loading.value = false
  }
})
```

### 订单创建

```typescript
import { orderApi } from '@/api'
import { toast } from '@/utils/toast'

const createOrder = async () => {
  try {
    const { orderId } = await orderApi.create({
      shopId: 1,
      items: [
        { dishId: 1, quantity: 2 },
        { dishId: 3, quantity: 1 }
      ],
      remark: '不要香菜',
      address: '北京市朝阳区...'
    })
    
    toast.success('订单创建成功！')
    router.push(`/order/${orderId}`)
  } catch (error) {
    // 错误已自动提示
  }
}
```

## 📋 API模块说明

| 模块 | 功能 |
|-----|------|
| userApi | 用户登录、注册、信息管理 |
| shopApi | 店铺列表、详情、搜索、菜品 |
| dishApi | 菜品详情、推荐、分类 |
| categoryApi | 分类列表 |
| carouselApi | 轮播图数据 |
| orderApi | 订单创建、列表、详情、支付 |
| cartApi | 购物车管理 |

## ✅ 功能特性总结

- ✅ 统一Result响应格式处理
- ✅ 请求/响应拦截器链
- ✅ 自动Token添加
- ✅ 重复请求取消
- ✅ 统一错误提示
- ✅ Toast消息提示组件
- ✅ TypeScript完整类型支持
- ✅ 原生Fetch API实现
- ✅ 超时和网络错误处理
- ✅ 环境配置支持
- ✅ 完整的API接口示例