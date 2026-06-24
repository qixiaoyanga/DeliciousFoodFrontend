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
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/shops',
    name: 'shops',
    component: () => import('@/views/ShopListView.vue'),
    meta: { showNavFooter: true }
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
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/CartView.vue'),
    meta: { showNavFooter: true }
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/CheckoutView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/order/detail',
    name: 'orderCreate',
    component: () => import('@/views/OrderDetailView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/order/detail/:id',
    name: 'orderDetail',
    component: () => import('@/views/OrderDetailPage.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/address',
    name: 'address',
    component: () => import('@/views/AddressView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/order/:id/pay',
    name: 'orderPay',
    component: () => import('@/views/PaymentConfirmView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/payment/confirm',
    name: 'paymentConfirm',
    component: () => import('@/views/PaymentConfirmView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/payment/success',
    name: 'paymentSuccess',
    component: () => import('@/views/PaymentSuccessView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/payment/alipay',
    name: 'alipay',
    component: () => import('@/views/AlipayView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/PersonalCenterView.vue'),
    meta: { showNavFooter: true }
  },
  {
    path: '/merchant/login',
    name: 'merchantLogin',
    component: () => import('@/views/MerchantLoginView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/merchant/register',
    name: 'merchantRegister',
    component: () => import('@/views/MerchantRegisterView.vue'),
    meta: { showNavFooter: false }
  },
  {
    path: '/merchant',
    name: 'merchant',
    component: () => import('@/views/MerchantView.vue'),
    meta: { showNavFooter: false }
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
