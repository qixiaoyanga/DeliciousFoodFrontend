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
      <div class="empty-icon">🍽️</div>
      <p class="empty-text">暂无店铺数据</p>
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
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-muted);
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
