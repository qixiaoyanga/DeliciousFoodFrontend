<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/order', name: '我的订单', icon: '📋' }
]

const isActive = (path: string) => {
  return route.path === path
}

const goToLogin = () => {
  router.push('/login')
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

      <button class="login-btn" @click="goToLogin">
        登录
      </button>
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

  .login-btn {
    padding: 6px 16px;
    font-size: 14px;
  }
}
</style>
