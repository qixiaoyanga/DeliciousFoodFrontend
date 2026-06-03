<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '@/utils/token'
import { authApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()

// 后端服务器基础URL
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

// 下拉菜单状态
const showDropdown = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const navItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/order', name: '我的订单', icon: '📋' }
]

const user = computed(() => getUser())

// 获取完整头像URL
const getAvatarUrl = (imagePath: string | undefined): string | undefined => {
  if (!imagePath) return undefined
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // 提取文件名（处理 /avatars/202506/xxx.jpg -> user_xxx.jpg）
  const fileName = imagePath.split('/').pop()
  if (!fileName) return undefined

  // 拼接为实际可访问的路径
  return `${SERVER_BASE_URL}/user/avatars/${fileName}`
}

const isActive = (path: string) => {
  return route.path === path
}

const goToLogin = () => {
  router.push('/login')
}

const goToProfile = () => {
  showDropdown.value = false
  router.push('/profile')
}

const handleLogout = async () => {
  showDropdown.value = false
  await authApi.logout()
  router.push('/login')
}

const toggleDropdown = () => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  showDropdown.value = !showDropdown.value
}

const onDropdownEnter = () => {
  // 鼠标进入下拉框，清除关闭定时器
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const onDropdownLeave = () => {
  // 鼠标离开下拉框，延迟关闭
  closeTimer = setTimeout(() => {
    showDropdown.value = false
    closeTimer = null
  }, 200)
}

const closeDropdown = () => {
  showDropdown.value = false
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1 class="brand-text">美味外卖</h1>
      </div>

      <nav class="navbar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>

      <template v-if="user">
        <div class="user-dropdown">
          <div class="user-trigger" @click="toggleDropdown" @mouseenter="onDropdownEnter">
            <img v-if="user.image" :src="getAvatarUrl(user.image)" class="user-avatar" alt="用户头像" />
            <div v-else class="user-avatar-default">
              {{ user.username.charAt(0) }}
            </div>
            <span class="user-name">{{ user.username }}</span>
            <span class="dropdown-arrow" :class="{ active: showDropdown }">▼</span>
          </div>
          <div class="dropdown-menu" v-show="showDropdown" @mouseenter="onDropdownEnter" @mouseleave="onDropdownLeave">
            <div class="dropdown-item" @click="goToProfile">
              <span class="dropdown-icon">👤</span>
              <span>个人中心</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item danger" @click="handleLogout">
              <span class="dropdown-icon">🚪</span>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <button class="login-btn" @click="goToLogin">
          登录
        </button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: -0.5px;
}

.navbar-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: all var(--transition-fast);
  transform: translateX(-50%);
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link:hover::after {
  width: 80%;
}

.nav-link.active {
  color: var(--primary-color);
  background: rgba(255, 107, 53, 0.08);
}

.nav-link.active::after {
  width: 80%;
}

.nav-icon {
  font-size: 18px;
}

.user-dropdown {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.user-avatar-default {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.dropdown-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  margin-left: 2px;
}

.dropdown-arrow.active {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 8px 0;
  z-index: 1000;
  animation: dropdownIn 0.2s ease-out;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: rgba(255, 107, 53, 0.08);
  color: var(--primary-color);
}

.dropdown-item.danger {
  color: var(--danger-color);
}

.dropdown-item.danger:hover {
  background: rgba(229, 57, 53, 0.08);
}

.dropdown-icon {
  font-size: 16px;
}

.dropdown-divider {
  height: 1px;
  background: var(--bg-primary);
  margin: 4px 0;
}

.login-btn {
  padding: 8px 24px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.login-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.login-btn:active {
  transform: translateY(0);
}

@media screen and (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
    height: 56px;
  }

  .brand-text {
    font-size: 20px;
  }

  .nav-text {
    display: none;
  }

  .nav-link {
    padding: 8px 12px;
  }

  .user-trigger {
    padding: 6px 8px;
  }

  .user-avatar,
  .user-avatar-default {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .user-name {
    display: none;
  }

  .dropdown-arrow {
    display: none;
  }

  .dropdown-menu {
    right: -8px;
    min-width: 160px;
  }

  .login-btn {
    padding: 6px 16px;
    font-size: 14px;
  }
}
</style>
