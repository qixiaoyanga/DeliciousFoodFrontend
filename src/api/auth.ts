// 用户端认证相关API接口
import { http } from '@/utils/request'
import { tokenManager } from '@/utils/token'
import type { User } from '@/types'
import { CUSTOMER_API } from './paths'

export interface LoginParams {
  phone?: string
  email?: string
  encryptedData: string
  timestamp?: string
  nonce?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken?: string
  uid: string
  username: string
  phone: string
  email?: string
  image?: string
  gender?: number
  createTime?: string
}

export interface RegisterParams {
  username: string
  encryptedData: string
  nickname?: string
}

export interface PublicKeyResult {
  publicKey: string
}

export interface RefreshTokenParams {
  fingerprint: string
}

export interface RefreshTokenResult {
  accessToken: string
  refreshToken?: string
}

export const authApi = {
  async getPublicKey(): Promise<PublicKeyResult> {
    return await http.get<PublicKeyResult>(CUSTOMER_API.PUBLIC_KEY, {}, { showError: false })
  },

  async login(data: LoginParams): Promise<LoginResult> {
    return await http.post<LoginResult>(CUSTOMER_API.LOGIN, data)
  },

  async register(data: RegisterParams): Promise<LoginResult> {
    return await http.post<LoginResult>(CUSTOMER_API.REGISTER, data)
  },

  async refresh(data: RefreshTokenParams): Promise<RefreshTokenResult> {
    return await http.post<RefreshTokenResult>(CUSTOMER_API.REFRESH, data, { showError: false })
  },

  async logout(): Promise<void> {
    try {
      await http.post(CUSTOMER_API.LOGOUT)
    } finally {
      tokenManager.clearTokens()
    }
  },

  async getCurrentUser(): Promise<User> {
    return await http.get<User>(CUSTOMER_API.USER_CURRENT)
  },

  async doLogin(
    phoneOrEmail: string,
    encryptedData: string,
    timestamp?: string,
    nonce?: string
  ): Promise<boolean> {
    try {
      const loginData: LoginParams = {
        encryptedData,
        timestamp,
        nonce
      }

      const phoneRegex = /^1[3-9]\d{9}$/
      if (phoneRegex.test(phoneOrEmail)) {
        loginData.phone = phoneOrEmail
      } else {
        loginData.email = phoneOrEmail
      }

      const result = await http.post<LoginResult>(CUSTOMER_API.LOGIN, loginData)
      const user: User = {
        uid: result.uid,
        username: result.username,
        phone: result.phone,
        email: result.email,
        image: result.image,
        gender: result.gender,
        createTime: result.createTime
      }
      // 存储 accessToken 和 refreshToken（refreshToken 会自动存入 cookie）
      tokenManager.setTokens(result.accessToken, user, result.refreshToken)
      return true
    } catch (error: any) {
      throw new Error(error.message || '登录失败，请重试')
    }
  }
}

export const tokenApi = {
  getTokenState() {
    return tokenManager.getState()
  },

  isAuthenticated() {
    return !tokenManager.isTokenExpired()
  },

  async refreshToken(): Promise<string | null> {
    return await (tokenManager as any).doRefreshToken()
  },

  clearTokens() {
    tokenManager.clearTokens()
  }
}
