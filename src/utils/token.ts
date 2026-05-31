// Token管理模块 - 双Token机制
import { http } from './request'
import { generateDeviceFingerprint } from './crypto'
import { toast } from './toast'
import { CUSTOMER_API } from '@/api/paths'

// Token存储键名
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'access_token'
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
const TOKEN_EXPIRE_KEY = import.meta.env.VITE_TOKEN_EXPIRE_KEY || 'token_expire'

// Token状态
interface TokenState {
  accessToken: string | null
  refreshToken: string | null
  expireTime: number | null
}

// 刷新锁（防止并发刷新）
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

// 订阅token刷新
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

// 发布token刷新
const publishTokenRefresh = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

// Token管理类
class TokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private expireTime: number | null = null

  constructor() {
    // 从localStorage恢复token
    this.loadFromStorage()
  }

  // 从localStorage加载token
  private loadFromStorage() {
    try {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      const expireStr = localStorage.getItem(TOKEN_EXPIRE_KEY)
      this.expireTime = expireStr ? parseInt(expireStr) : null
    } catch (error) {
      console.error('加载Token失败:', error)
    }
  }

  // 保存到localStorage
  private saveToStorage() {
    try {
      if (this.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken)
      }
      if (this.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken)
      }
      if (this.expireTime) {
        localStorage.setItem(TOKEN_EXPIRE_KEY, this.expireTime.toString())
      }
    } catch (error) {
      console.error('保存Token失败:', error)
    }
  }

  // 设置Token
  setTokens(accessToken: string, refreshToken?: string, expireTime?: number) {
    this.accessToken = accessToken
    if (refreshToken) {
      this.refreshToken = refreshToken
    }
    if (expireTime) {
      this.expireTime = expireTime
    }
    this.saveToStorage()
  }

  // 获取AccessToken
  getAccessToken(): string | null {
    return this.accessToken
  }

  // 获取RefreshToken
  getRefreshToken(): string | null {
    return this.refreshToken
  }

  // 检查Token是否过期
  isTokenExpired(): boolean {
    if (!this.expireTime) {
      return !this.accessToken
    }
    return Date.now() >= this.expireTime
  }

  // 检查Token是否即将过期（提前5分钟刷新）
  isTokenExpiringSoon(): boolean {
    if (!this.expireTime) {
      return false
    }
    // 提前5分钟刷新
    return Date.now() >= this.expireTime - 5 * 60 * 1000
  }

  // 清除Token
  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.expireTime = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRE_KEY)
  }

  // 刷新Token
  async doRefreshToken(): Promise<string | null> {
    // 如果已经在刷新中，等待刷新完成
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          resolve(token)
        })
      })
    }

    if (!this.refreshToken) {
      toast.error('登录已过期，请重新登录')
      return null
    }

    isRefreshing = true

    try {
      // 调用刷新接口
      const result = await http.post<{
        accessToken: string
        refreshToken?: string
      }>(CUSTOMER_API.REFRESH, {
        fingerprint: generateDeviceFingerprint()
      })

      if (result.accessToken) {
        // 更新Token
        this.setTokens(
          result.accessToken,
          result.refreshToken || this.refreshToken || undefined
        )

        // 通知所有等待的请求
        publishTokenRefresh(result.accessToken)

        return result.accessToken
      }

      return null
    } catch (error) {
      // 刷新失败，清除Token
      this.clearTokens()
      toast.error('会话已过期，请重新登录')
      window.location.href = '/login'
      return null
    } finally {
      isRefreshing = false
    }
  }

  // 处理401错误
  async handleUnauthorized(): Promise<string | null> {
    return await this.doRefreshToken()
  }

  // 获取状态
  getState(): TokenState {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expireTime: this.expireTime
    }
  }
}

// 导出单例
export const tokenManager = new TokenManager()

// 便捷方法
export const getAccessToken = () => tokenManager.getAccessToken()
export const setTokens = (accessToken: string, refreshToken?: string) =>
  tokenManager.setTokens(accessToken, refreshToken)
export const clearTokens = () => tokenManager.clearTokens()
export const isTokenExpired = () => tokenManager.isTokenExpired()
