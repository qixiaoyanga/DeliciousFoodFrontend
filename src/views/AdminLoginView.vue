<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminAuthApi } from '@/api/admin'
import { tokenManager } from '@/utils/token'
import { toast } from '@/utils/toast'
import type { AdminLoginInfo } from '@/types'

const router = useRouter()

const loginForm = ref({
  username: '',
  password: ''
})
const isLoading = ref(false)

const handleLogin = async () => {
  if (!loginForm.value.username.trim()) {
    toast.error('请输入用户名')
    return
  }
  if (!loginForm.value.password) {
    toast.error('请输入密码')
    return
  }

  isLoading.value = true
  try {
    const result = await adminAuthApi.login({
      username: loginForm.value.username.trim(),
      password: loginForm.value.password
    }) as AdminLoginInfo

    // 保存 token 和用户信息
    tokenManager.setTokens(
      result.accessToken,
      {
        uid: String(result.id),
        username: result.username,
        phone: result.phone
      },
      undefined,
      undefined,
      'admin'
    )

    toast.success('登录成功')
    router.push('/admin')
  } catch (error: any) {
    toast.error(error.message || '登录失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="admin-login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo-icon">🛡️</div>
        <h1>DeliciousFood 管理后台</h1>
        <p>管理员登录</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">
            <span class="label-icon">👤</span>
            用户名
          </label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            class="form-input"
            placeholder="请输入管理员用户名"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="label-icon">🔒</span>
            密码
          </label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner-small"></span>
          <span v-else>登 录</span>
        </button>
      </form>

      <div class="login-footer">
        <span>© 2026 DeliciousFood Admin</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}

.login-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  font-size: 14px;
}

.form-input {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: #ffffff;
  outline: none;
  transition: all var(--transition-fast);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:focus {
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.12);
}

.login-btn {
  padding: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
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

.login-footer {
  text-align: center;
  margin-top: 32px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
