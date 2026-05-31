import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/test-api',
    name: 'test-api',
    component: () => import('@/views/TestApi.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { showNavFooter: true }
  },
  {
    path: '/shop/:id',
    name: 'shop',
    component: () => import('@/views/ShopView.vue'),
    meta: { showNavFooter: true }
  },
  {
    path: '/order',
    name: 'order',
    component: () => import('@/views/OrderView.vue'),
    meta: { showNavFooter: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
