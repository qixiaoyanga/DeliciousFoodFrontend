// HTTP请求服务 - 完整认证流程
import type { Result, RequestConfig } from '@/types'
import { toast } from './toast'
import { tokenManager, getAccessToken } from './token'
import { generateDeviceFingerprint } from './crypto'

// 环境配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TIMEOUT = 30000

// 错误状态码
const ErrorCodes = {
  TOKEN_EXPIRED: 401001,
  USER_STATUS_CHANGED: 401002,
  REPLAY_ATTACK: 401003,
  REQUEST_EXPIRED: 401004,
  DEVICE_ANOMALY: 401005,
  TOKEN_BLACKLISTED: 401006
}

// 请求队列管理
const pendingRequests = new Map<string, AbortController>()

// 生成请求key
const generateRequestKey = (config: RequestConfig): string => {
  const { url, method = 'GET', data, params } = config
  return `${method.toUpperCase()}:${url}:${JSON.stringify(data || {})}:${JSON.stringify(params || {})}`
}

// 请求拦截器链
const requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [
  // 1. 添加时间戳防缓存
  (config: RequestConfig): RequestConfig => {
    const timestamp = Date.now()
    config.params = { ...config.params, _t: timestamp }
    return config
  },

  // 2. 添加认证Token
  (config: RequestConfig): RequestConfig => {
    const token = getAccessToken()
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    }
    return config
  },

  // 3. 添加设备指纹
  (config: RequestConfig): RequestConfig => {
    config.headers = {
      ...config.headers,
      'X-Device-Fingerprint': generateDeviceFingerprint()
    }
    return config
  },

  // 4. 添加请求ID（防重放）
  (config: RequestConfig): RequestConfig => {
    config.headers = {
      ...config.headers,
      'X-Request-ID': generateUUID()
    }
    return config
  },

  // 5. 取消重复请求
  (config: RequestConfig): RequestConfig => {
    const requestKey = generateRequestKey(config)
    if (pendingRequests.has(requestKey)) {
      const controller = pendingRequests.get(requestKey)
      controller?.abort()
    }
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)
    return config
  }
]

// 响应拦截器链
const responseInterceptors: Array<(response: any, config: RequestConfig) => any> = [
  // 1. 解析JSON响应，包括HTTP错误状态
  async (response: Response, config: RequestConfig): Promise<Result> => {
    console.log('[响应拦截器1] HTTP状态码:', response.status, response.ok)

    // 处理204 No Content
    if (response.status === 204) {
      return {
        code: 200,
        message: 'success',
        data: null,
        timestamp: Date.now()
      }
    }

    const contentType = response.headers.get('content-type') || ''
    console.log('[响应拦截器1] Content-Type:', contentType)

    if (contentType.includes('application/json')) {
      const result = await response.json()
      console.log('[响应拦截器1] 解析结果:', result)
      // 如果是HTTP错误状态但返回了JSON，就直接返回
      return result
    }

    // 如果没有返回JSON但HTTP状态码不是200，就返回一个错误Result
    if (!response.ok) {
      return {
        code: response.status,
        message: '请求失败',
        data: null,
        timestamp: Date.now()
      }
    }

    return {
      code: 200,
      message: 'success',
      data: response,
      timestamp: Date.now()
    }
  },

  // 2. 移除完成的请求
  (result: Result, config: RequestConfig): Result => {
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)
    return result
  },

  // 3. 处理业务错误
  (result: Result, config: RequestConfig): Result => {
    console.log('[响应拦截器3] 接收到的result:', result)

    // 清理请求队列
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)

    // 非200状态码，提示异常信息
    if (result.code !== 200) {
      const message = result.message || '请求失败'
      console.log('[响应拦截器3] 检测到错误code:', result.code, '准备使用message:', message)
      if (config.showError !== false) {
        toast.error(message)
      }
      const error = new Error(message)
      ;(error as any).code = result.code
      console.log('[响应拦截器3] throw error:', error)
      throw error
    }

    return result
  }
]

// 错误拦截器链
const errorInterceptors: Array<(error: any, config: RequestConfig) => any> = [
  // 1. 清理失败的请求
  (error: any, config: RequestConfig): any => {
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)
    return error
  },

  // 2. 处理网络错误等非HTTP响应错误 - 只在没有message时才覆盖
  (error: any, config: RequestConfig): any => {
    console.log('[错误拦截器2] 接收到的error:', error)
    console.log('[错误拦截器2] error.message:', error.message)

    // 如果已经有 message 了，就不覆盖
    if (error.message) {
      console.log('[错误拦截器2] 已有message，不覆盖')
      return error
    }

    if (error.name === 'AbortError') {
      error.message = '请求已取消'
    } else if (error.name === 'TimeoutError') {
      error.message = '请求超时'
    } else if (!navigator.onLine) {
      error.message = '网络连接失败'
    } else if (!error.status) {
      // 没有status的是真正的网络错误
      error.message = error.message || '请求失败'
    }
    return error
  },

  // 3. 显示错误提示，只在真正的网络错误时显示
  (error: any, config: RequestConfig): any => {
    // 只有没有status的错误才在这里显示（网络错误）
    if (config.showError !== false && !error.status) {
      const message = error.message || '请求失败'
      toast.error(message)
    }
    return error
  }
]

// 生成UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 执行同步拦截器链
const executeInterceptorsSync = <T>(
  interceptors: Array<(...args: any[]) => any>,
  ...args: any[]
): T => {
  let isFirst = true
  let result: any
  for (const interceptor of interceptors) {
    if (isFirst) {
      result = interceptor(...args)
      isFirst = false
    } else {
      result = interceptor(result, ...args.slice(1))
    }
  }
  return result as T
}

// 执行异步拦截器链
const executeInterceptorsAsync = async <T>(
  interceptors: Array<(...args: any[]) => any>,
  ...args: any[]
): Promise<T> => {
  let isFirst = true
  let result: any
  for (const interceptor of interceptors) {
    if (isFirst) {
      result = await interceptor(...args)
      isFirst = false
    } else {
      result = await interceptor(result, ...args.slice(1))
    }
  }
  return result as T
}

// 核心请求方法
const request = async <T = any>(config: RequestConfig): Promise<T> => {
  const {
    url,
    method = 'GET',
    data,
    params,
    headers = {},
    timeout = TIMEOUT,
    showError = true
  } = config

  // 跳过认证的请求（登录、刷新等）
  const skipAuth = ['/login', '/refresh', '/public-key', '/register'].some(
    path => url.includes(path)
  )

  // 构建完整URL
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // 处理查询参数
  if (params) {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, String(params[key]))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
    }
  }

  // 构建请求配置
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include' // 携带Cookie
  }

  // 添加请求体
  if (data && method !== 'GET') {
    fetchOptions.body = JSON.stringify(data)
  }

  // 执行请求拦截器
  const finalConfig = executeInterceptorsSync<RequestConfig>(
    requestInterceptors,
    config
  )

  // 超时处理
  const controller = new AbortController()
  fetchOptions.signal = controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // 发送请求
    const response = await fetch(fullUrl, fetchOptions)
    clearTimeout(timeoutId)

    // 执行响应拦截器，统一处理，包括HTTP错误状态
    const result = await executeInterceptorsAsync<Result>(
      responseInterceptors,
      response,
      finalConfig
    )

    // 统一处理Result类型响应
    if (result && 'code' in result) {
      const apiResult = result as Result<T>

      // 检查是否需要刷新Token
      if (apiResult.code === 401) {
        const errorCode = (apiResult as any).errorCode

        // Token过期，尝试刷新
        if (errorCode === ErrorCodes.TOKEN_EXPIRED && !skipAuth) {
          const newToken = await tokenManager.handleUnauthorized()
          if (newToken) {
            // 使用新Token重试请求
            if (!finalConfig.headers) {
              finalConfig.headers = {}
            }
            finalConfig.headers['Authorization'] = `Bearer ${newToken}`
            return request<T>(finalConfig)
          }
        }

        // 用户状态变更
        if (errorCode === ErrorCodes.USER_STATUS_CHANGED) {
          tokenManager.clearTokens()
          toast.error('账号状态已变更，请重新登录')
          window.location.href = '/login'
        }

        // 设备异常
        if (errorCode === ErrorCodes.DEVICE_ANOMALY) {
          tokenManager.clearTokens()
          toast.error('设备异常，请重新登录')
          window.location.href = '/login'
        }

        // 其他401错误
        const error = new Error(apiResult.message)
        ;(error as any).code = apiResult.code
        throw error
      }

      if (apiResult.code === 200) {
        return apiResult.data as T
      }

      // 非200状态码不应该走到这里，因为响应拦截器已经抛出异常了
      return apiResult.data as T
    }

    return result as T
  } catch (error) {
    console.log('[request catch] 捕获到error:', error)
    // 执行错误拦截器
    const finalError = executeInterceptorsSync(errorInterceptors, error, finalConfig)
    console.log('[request catch] finalError:', finalError)
    throw finalError
  }
}

// 快捷方法
export const http = {
  get: <T = any>(url: string, params?: any, config?: Partial<RequestConfig>) => {
    return request<T>({
      url,
      method: 'GET',
      params,
      ...config
    })
  },

  post: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) => {
    return request<T>({
      url,
      method: 'POST',
      data,
      ...config
    })
  },

  put: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) => {
    return request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    })
  },

  delete: <T = any>(url: string, params?: any, config?: Partial<RequestConfig>) => {
    return request<T>({
      url,
      method: 'DELETE',
      params,
      ...config
    })
  },

  patch: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) => {
    return request<T>({
      url,
      method: 'PATCH',
      data,
      ...config
    })
  },

  // 取消所有请求
  cancelAll: () => {
    pendingRequests.forEach(controller => controller.abort())
    pendingRequests.clear()
  },

  // 取消特定请求
  cancel: (config: RequestConfig) => {
    const requestKey = generateRequestKey(config)
    const controller = pendingRequests.get(requestKey)
    controller?.abort()
    pendingRequests.delete(requestKey)
  }
}

// 导出错误码
export { ErrorCodes }

export default http
