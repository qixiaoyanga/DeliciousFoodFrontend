// Token管理模块 - accessToken内存存储 + refreshToken HttpOnly Cookie（后端管理）
import { http } from './request'
import { generateDeviceFingerprint } from './crypto'
import { toast } from './toast'
import { CUSTOMER_API } from '@/api/paths'
import type { User } from '@/types'

// Token状态
interface TokenState {
  accessToken: string | null
  refreshToken: string | null
  expireTime: number | null
  user: User | null
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
  private user: User | null = null

  // 设置Token和用户信息（accessToken内存，refreshToken由后端通过HttpOnly Cookie管理）
  setTokens(accessToken: string, user?: User, refreshToken?: string, expireTime?: number) {
    this.accessToken = accessToken
    if (user) {
      this.user = user
    }
    if (refreshToken) {
      this.refreshToken = refreshToken
    }
    if (expireTime) {
      this.expireTime = expireTime
    }
  }

  // 获取用户信息
  getUser(): User | null {
    return this.user
  }

  // 设置用户信息
  setUser(user: User) {
    this.user = user
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
    return Date.now() >= this.expireTime - 5 * 60 * 1000
  }

  // 清除Token（内存）- HttpOnly Cookie由后端在logout时清除
  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.expireTime = null
    this.user = null
  }

  // 刷新Token
  async doRefreshToken(): Promise<string | null> {
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
      const result = await http.post<{
        accessToken: string
        refreshToken?: string
      }>(CUSTOMER_API.REFRESH, {
        fingerprint: generateDeviceFingerprint()
      })

      if (result.accessToken) {
        this.setTokens(
          result.accessToken,
          undefined,
          result.refreshToken || this.refreshToken || undefined
        )

        publishTokenRefresh(result.accessToken)

        return result.accessToken
      }

      return null
    } catch (error) {
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
      expireTime: this.expireTime,
      user: this.user
    }
  }
}

// 导出单例
export const tokenManager = new TokenManager()

// 便捷方法
export const getAccessToken = () => tokenManager.getAccessToken()
export const getRefreshToken = () => tokenManager.getRefreshToken()
export const getUser = () => tokenManager.getUser()
export const setUser = (user: User) => tokenManager.setUser(user)
export const setTokens = (accessToken: string, user?: User, refreshToken?: string) =>
  tokenManager.setTokens(accessToken, user, refreshToken)
export const clearTokens = () => tokenManager.clearTokens()
export const isTokenExpired = () => tokenManager.isTokenExpired()

// 自动登录 - 通过refreshToken刷新获取新的accessToken
export const autoLogin = async (): Promise<boolean> => {
  try {
    const result = await http.post<{
      accessToken: string
      refreshToken?: string
      uid: string
      username: string
      phone: string
      email?: string
      image?: string
      gender?: number
      createTime?: string
    }>(CUSTOMER_API.REFRESH, {
      fingerprint: generateDeviceFingerprint()
    })

    if (result.accessToken) {
      const user: User = {
        uid: result.uid,
        username: result.username,
        phone: result.phone,
        email: result.email,
        image: result.image,
        gender: result.gender,
        createTime: result.createTime
      }
      tokenManager.setTokens(result.accessToken, user, result.refreshToken)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}