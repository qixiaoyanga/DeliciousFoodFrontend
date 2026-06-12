<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { encryptPassword } from '@/utils/crypto'
import { toast } from '@/utils/toast'

const router = useRouter()

const username = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const birthday = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const validatePhone = (value: string) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(value)
}

const validateEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

const handleRegister = async () => {
  if (isLoading.value) {
    return
  }

  errorMessage.value = ''

  if (!username.value) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!phone.value) {
    errorMessage.value = '请输入手机号'
    return
  }
  if (!validatePhone(phone.value)) {
    errorMessage.value = '请输入正确的手机号'
    return
  }

  if (!email.value) {
    errorMessage.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    errorMessage.value = '请输入正确的邮箱'
    return
  }

  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return
  }

  if (!confirmPassword.value) {
    errorMessage.value = '请输入确认密码'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (!birthday.value) {
    errorMessage.value = '请选择生日'
    return
  }

  isLoading.value = true
  try {
    const publicKey = await authApi.getPublicKey()
    const { encryptedData, timestamp, nonce } = encryptPassword(password.value, publicKey)
    
    const result = await authApi.register({
      username: username.value,
      phone: phone.value,
      email: email.value,
      birthday: birthday.value,
      encryptedData,
      timestamp,
      nonce
    })

    toast.success('注册成功！')
    router.push('/login')
  } catch (error: any) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1 class="register-title">美味外卖</h1>
        <p class="register-subtitle">DELICIOUS FOOD</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名 *</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="form-input"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label class="form-label">手机号 *</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            class="form-input"
            maxlength="11"
          />
        </div>

        <div class="form-group">
          <label class="form-label">邮箱 *</label>
          <input
            v-model="email"
            type="email"
            placeholder="请输入邮箱"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码 *</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码（至少6位）"
            class="form-input"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label class="form-label">确认密码 *</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="form-input"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label class="form-label">生日 *</label>
          <input
            v-model="birthday"
            type="date"
            class="form-input"
          />
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button
          type="submit"
          class="register-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-text">注册中...</span>
          <span v-else>立即注册</span>
        </button>

        <div class="login-link">
          <span>已有账号？</span>
          <button type="button" class="link-btn" @click="goToLogin">立即登录</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, #ff8c42 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.register-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  background: rgba(74, 55, 40, 0.03);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
}

.form-input::placeholder {
  color: var(--text-hint);
}

.error-message {
  padding: 12px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #f56c6c;
  text-align: center;
}

.register-btn {
  padding: 14px;
  background: var(--primary-color);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>