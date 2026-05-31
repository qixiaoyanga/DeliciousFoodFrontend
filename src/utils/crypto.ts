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
    console.log('✅ RSA公钥已缓存，直接返回')
    console.log('缓存的公钥:', publicKeyCache.substring(0, 50) + '...')
    return publicKeyCache
  }

  try {
    console.log('🔄 正在获取RSA公钥...')
    console.log('请求路径:', `${BASE_URL}${CUSTOMER_API.PUBLIC_KEY}`)

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

    console.log('📥 请求响应:')
    console.log('- 类型:', typeof publicKey)
    console.log('- 长度:', publicKey?.length || 0)
    console.log('- 前50字符:', String(publicKey).substring(0, 50))

    if (!publicKey || typeof publicKey !== 'string') {
      console.error('❌ 后端返回的数据类型错误:', typeof publicKey, publicKey)
      throw new Error('后端返回的公钥格式错误')
    }

    if (!publicKey.includes('-----BEGIN')) {
      console.warn('⚠️ 警告：公钥可能缺少 PEM 头')
    }

    publicKeyCache = publicKey
    console.log('✅ 公钥已缓存，长度:', publicKey.length)
    return publicKey
  } catch (error: any) {
    console.error('❌ 获取公钥失败:')
    console.error('- 错误类型:', error?.constructor?.name)
    console.error('- 错误信息:', error?.message)
    console.error('- 完整错误:', error)
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
  try {
    const timestamp = getTimestamp()
    const nonce = generateNonce()

    console.log('🔐 正在加密密码...')
    console.log('- 密码长度:', password.length)

    // 使用 RSA 公钥加密密码
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)
    const encryptedData = encryptor.encrypt(password)

    if (!encryptedData) {
      throw new Error('RSA加密失败：加密结果为空，请检查公钥格式是否正确')
    }

    console.log('✅ RSA加密完成')
    console.log('- 加密后长度:', encryptedData.length)

    return {
      encryptedData,
      timestamp,
      nonce
    }
  } catch (error) {
    console.error('❌ 加密失败:', error)
    throw error
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

  // 简单的hash实现
  let hash = 0
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16)
}

// 清除公钥缓存
export const clearPublicKeyCache = () => {
  publicKeyCache = null
}
