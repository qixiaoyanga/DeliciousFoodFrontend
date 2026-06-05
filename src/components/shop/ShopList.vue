<script setup lang="ts">
import { computed } from 'vue'
import type { Shop } from '@/types'
import ShopCard from './ShopCard.vue'

interface Props {
  shops: Shop[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})
</script>

<template>
  <div class="shop-list">
    <div v-if="loading" class="shop-list-loading">
      <div v-for="i in 6" :key="i" class="shop-card-skeleton">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line rating"></div>
          <div class="skeleton-line meta"></div>
        </div>
      </div>
    </div>

    <div v-else class="shop-list-grid">
      <ShopCard
        v-for="shop in shops"
        :key="shop.id"
        :shop="shop"
      />
    </div>

    <div v-if="!loading && shops.length === 0" class="empty-state">
      <div class="empty-illustration">
        <div class="empty-icon">🏪</div>
        <div class="empty-decoration empty-decoration-1">🍔</div>
        <div class="empty-decoration empty-decoration-2">🍕</div>
        <div class="empty-decoration empty-decoration-3">🍟</div>
      </div>
      <h3 class="empty-title">暂无店铺</h3>
      <p class="empty-text">当前分类下还没有店铺入驻</p>
      <button class="empty-action" @click="$emit('refresh')">
        <span class="action-icon">🔄</span>
        刷新试试
      </button>
    </div>
  </div>
</template>

<style scoped>
.shop-list {
  width: 100%;
}

.shop-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.shop-list-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.shop-card-skeleton {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  padding: 16px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-line.title {
  width: 70%;
  height: 20px;
}

.skeleton-line.rating {
  width: 50%;
}

.skeleton-line.meta {
  width: 90%;
  margin-bottom: 0;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.03) 0%, rgba(255, 217, 61, 0.03) 100%);
  border-radius: var(--radius-xl);
  margin-top: 24px;
}

.empty-illustration {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 24px;
}

.empty-icon {
  font-size: 80px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 3s ease-in-out infinite;
}

.empty-decoration {
  position: absolute;
  font-size: 32px;
}

.empty-decoration-1 {
  top: 10%;
  left: 10%;
  animation: float 3s ease-in-out infinite 0.5s;
}

.empty-decoration-2 {
  top: 10%;
  right: 10%;
  animation: float 3s ease-in-out infinite 1s;
}

.empty-decoration-3 {
  bottom: 20%;
  right: 20%;
  animation: float 3s ease-in-out infinite 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.empty-action:active {
  transform: translateY(0);
}

.action-icon {
  font-size: 16px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 768px) {
  .shop-list-grid,
  .shop-list-loading {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  .shop-list-grid,
  .shop-list-loading {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
