// 加密和设备指纹工具 - 简单RSA加密实现
import JSEncrypt from 'jsencrypt'
import { CUSTOMER_API } from '@/api/paths'

// 环境配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// RSA公钥缓存
let publicKeyCache: string | null = null

// 生成随机字符串
export const generateNonce = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 获取时间戳
const getTimestamp = (): string => {
  return Date.now().toString()
}

// 获取RSA公钥
export const getPublicKey = async (): Promise<string> => {
  if (publicKeyCache) {
    return publicKeyCache
  }

  try {
    const response = await fetch(`${BASE_URL}${CUSTOMER_API.PUBLIC_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    const publicKey = result.data

    if (!publicKey || typeof publicKey !== 'string') {
      throw new Error('后端返回的公钥格式错误')
    }

    publicKeyCache = publicKey
    return publicKey
  } catch (error: any) {
    throw new Error('无法获取RSA公钥，请检查后端服务是否启动')
  }
}

// 加密结果接口
export interface EncryptedResult {
  encryptedData: string
  timestamp: string
  nonce: string
}

// RSA加密密码
export const encryptPassword = (password: string, publicKey: string): EncryptedResult => {
  const timestamp = getTimestamp()
  const nonce = generateNonce()

  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  const encryptedData = encryptor.encrypt(password)

  if (!encryptedData) {
    throw new Error('RSA加密失败：加密结果为空，请检查公钥格式是否正确')
  }

  return {
    encryptedData,
    timestamp,
    nonce
  }
}

// 生成设备指纹
export const generateDeviceFingerprint = (): string => {
  const ua = navigator.userAgent
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language
  const platform = navigator.platform

  const rawFingerprint = `${ua}|${screen}|${timezone}|${language}|${platform}`

  let hash = 0
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(16)
}

// 清除公钥缓存
export const clearPublicKeyCache = () => {
  publicKeyCache = null
}