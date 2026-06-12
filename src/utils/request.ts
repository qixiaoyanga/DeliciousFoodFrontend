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
  TOKEN_BLACKLISTED: 401006,
  TOKEN_NEED_REFRESH: 400000,
  NEED_LOGIN: 402000
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
  (config: RequestConfig): RequestConfig => {
    const timestamp = Date.now()
    config.params = { ...config.params, _t: timestamp }
    return config
  },

  (config: RequestConfig): RequestConfig => {
    const accessToken = getAccessToken()
    if (accessToken && !config.headers?.token) {
      config.headers = {
        ...config.headers,
        'token': accessToken
      }
    }
    return config
  },

  (config: RequestConfig): RequestConfig => {
    config.headers = {
      ...config.headers,
      'X-Device-Fingerprint': generateDeviceFingerprint()
    }
    return config
  },

  (config: RequestConfig): RequestConfig => {
    config.headers = {
      ...config.headers,
      'X-Request-ID': generateUUID()
    }
    return config
  },

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
  async (response: Response, config: RequestConfig): Promise<Result> => {
    if (response.status === 204) {
      return {
        code: 200,
        message: 'success',
        data: null,
        timestamp: Date.now()
      }
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const result = await response.json()
      return result
    }

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

  (result: Result, config: RequestConfig): Result => {
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)
    return result
  },

  (result: Result, config: RequestConfig): Result => {
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)

    if (result.code === ErrorCodes.NEED_LOGIN || result.code === ErrorCodes.TOKEN_NEED_REFRESH) {
      return result
    }

    if (result.code !== 200) {
      const message = result.message || '请求失败'
      if (config.showError !== false) {
        toast.error(message)
      }
      const error = new Error(message)
      ;(error as any).code = result.code
      throw error
    }

    return result
  }
]

// 错误拦截器链
const errorInterceptors: Array<(error: any, config: RequestConfig) => any> = [
  (error: any, config: RequestConfig): any => {
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)
    return error
  },

  (error: any, config: RequestConfig): any => {
    if (error.message) {
      return error
    }

    if (error.name === 'AbortError') {
      error.message = '请求已取消'
    } else if (error.name === 'TimeoutError') {
      error.message = '请求超时'
    } else if (!navigator.onLine) {
      error.message = '网络连接失败'
    } else if (!error.status) {
      error.message = error.message || '请求失败'
    }
    return error
  },

  (error: any, config: RequestConfig): any => {
    if (config.showError === false) {
      return error
    }

    if (error.code) {
      return error
    }

    if (!error.status) {
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

  const skipAuth = ['/login', '/refresh', '/public-key', '/register'].some(
    path => url.includes(path)
  )

  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

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

  const finalConfig = executeInterceptorsSync<RequestConfig>(
    requestInterceptors,
    config
  )

  const isFormData = finalConfig.data instanceof FormData

  const fetchOptions: RequestInit = {
    method: finalConfig.method || method,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...finalConfig.headers
    },
    credentials: 'include'
  }

  if (finalConfig.data && (finalConfig.method || method) !== 'GET') {
    fetchOptions.body = isFormData ? finalConfig.data : JSON.stringify(finalConfig.data)
  }

  const controller = new AbortController()
  fetchOptions.signal = controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(fullUrl, fetchOptions)
    clearTimeout(timeoutId)

    const result = await executeInterceptorsAsync<Result>(
      responseInterceptors,
      response,
      finalConfig
    )

    if (result && 'code' in result) {
      const apiResult = result as Result<T>

      if (apiResult.code === ErrorCodes.TOKEN_NEED_REFRESH && !skipAuth) {
        try {
          const newToken = await tokenManager.handleUnauthorized()
          if (newToken) {
            if (!finalConfig.headers) {
              finalConfig.headers = {}
            }
            finalConfig.headers['Authorization'] = `Bearer ${newToken}`
            return request<T>(finalConfig)
          }
        } catch (refreshError) {
          if ((refreshError as any).code === 402000) {
            tokenManager.clearTokens()
            if (showError !== false) {
              toast.error((refreshError as any).message || '登录已过期，请重新登录')
              window.location.href = '/login'
            }
            throw refreshError
          }
        }
      }

      if (apiResult.code === 401) {
        const errorCode = (apiResult as any).errorCode

        if (errorCode === ErrorCodes.TOKEN_EXPIRED && !skipAuth) {
          try {
            const newToken = await tokenManager.handleUnauthorized()
            if (newToken) {
              if (!finalConfig.headers) {
                finalConfig.headers = {}
              }
              finalConfig.headers['Authorization'] = `Bearer ${newToken}`
              return request<T>(finalConfig)
            }
          } catch (refreshError) {
            if ((refreshError as any).code === 402000) {
              tokenManager.clearTokens()
              if (showError !== false) {
                toast.error((refreshError as any).message || '登录已过期，请重新登录')
                window.location.href = '/login'
              }
              throw refreshError
            }
          }
        }

        if (errorCode === ErrorCodes.USER_STATUS_CHANGED) {
          tokenManager.clearTokens()
          toast.error('账号状态已变更，请重新登录')
          window.location.href = '/login'
        }

        if (errorCode === ErrorCodes.DEVICE_ANOMALY) {
          tokenManager.clearTokens()
          toast.error('设备异常，请重新登录')
          window.location.href = '/login'
        }

        const error = new Error(apiResult.message)
        ;(error as any).code = apiResult.code
        throw error
      }

      if (apiResult.code === ErrorCodes.NEED_LOGIN && !skipAuth) {
        tokenManager.clearTokens()
        if (showError !== false) {
          toast.error(apiResult.message || '请重新登录')
          window.location.href = '/login'
        }
        const error = new Error(apiResult.message || '请重新登录')
        ;(error as any).code = apiResult.code
        throw error
      }

      if (apiResult.code === 200) {
        return apiResult.data as T
      }

      return apiResult.data as T
    }

    return result as T
  } catch (error) {
    const finalError = executeInterceptorsSync(errorInterceptors, error, finalConfig)
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

  cancelAll: () => {
    pendingRequests.forEach(controller => controller.abort())
    pendingRequests.clear()
  },

  cancel: (config: RequestConfig) => {
    const requestKey = generateRequestKey(config)
    const controller = pendingRequests.get(requestKey)
    controller?.abort()
    pendingRequests.delete(requestKey)
  }
}

export { ErrorCodes }

export default http
