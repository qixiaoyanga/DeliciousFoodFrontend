<script setup lang="ts">
import type { Dish } from '@/types'

interface Props {
  dish: Dish
}

defineProps<Props>()
</script>

<template>
  <div class="dish-card">
    <div class="dish-image-wrapper">
      <img :src="dish.image" :alt="dish.name" class="dish-image" />
      <div class="dish-badges">
        <span class="badge hot" v-if="dish.sales > 2000">热销</span>
        <span class="badge discount" v-if="dish.originalPrice">特惠</span>
      </div>
    </div>

    <div class="dish-info">
      <h4 class="dish-name">{{ dish.name }}</h4>
      <p class="dish-description" v-if="dish.description">
        {{ dish.description }}
      </p>
      
      <div class="dish-meta">
        <div class="dish-rating">
          <span class="rating-value">{{ dish.rating }}</span>
          <span class="rating-star">⭐</span>
        </div>
        <span class="dish-sales">月售{{ dish.sales }}</span>
      </div>

      <div class="dish-price">
        <span class="current-price">¥{{ dish.price }}</span>
        <span class="original-price" v-if="dish.originalPrice">
          ¥{{ dish.originalPrice }}
        </span>
        <button class="add-btn">+</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  min-width: 200px;
  cursor: pointer;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.dish-card:active {
  transform: translateY(-2px) scale(0.98);
}

.dish-image-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.dish-card:hover .dish-image {
  transform: scale(1.08);
}

.dish-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
}

.badge {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  color: white;
}

.badge.hot {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
}

.badge.discount {
  background: var(--secondary-color);
  color: var(--text-primary);
}

.dish-info {
  padding: 12px;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-description {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dish-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.dish-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.rating-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
}

.rating-star {
  font-size: 12px;
}

.dish-sales {
  font-size: 12px;
  color: var(--text-muted);
}

.dish-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.original-price {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.add-btn {
  margin-left: auto;
  width: 28px;
  height: 28px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  line-height: 1;
}

.add-btn:hover {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.add-btn:active {
  transform: scale(0.95);
}

@media screen and (max-width: 768px) {
  .dish-card {
    min-width: 160px;
  }

  .dish-image-wrapper {
    height: 140px;
  }

  .dish-name {
    font-size: 14px;
  }

  .current-price {
    font-size: 18px;
  }
}
</style>
