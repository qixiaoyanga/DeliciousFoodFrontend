<script setup lang="ts">
import type { Dish } from '@/types'
import DishCard from './DishCard.vue'
import { useRouter } from 'vue-router'

interface Props {
  dishes: Dish[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: '推荐菜品'
})

const router = useRouter()

const handleDishClick = (dish: Dish) => {
  if (dish.shopId) {
    router.push(`/shop/${dish.shopId}`)
  }
}
</script>

<template>
  <section class="dish-recommend">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <a href="#" class="section-more">
        查看更多
        <span class="arrow">→</span>
      </a>
    </div>

    <div class="dish-scroll">
      <div class="dish-grid">
        <DishCard
          v-for="dish in dishes"
          :key="dish.id"
          :dish="dish"
          @click="handleDishClick"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.dish-recommend {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.section-more:hover {
  gap: 10px;
}

.arrow {
  font-size: 16px;
}

.dish-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) rgba(74, 55, 40, 0.1);
}

.dish-scroll::-webkit-scrollbar {
  height: 6px;
}

.dish-scroll::-webkit-scrollbar-track {
  background: rgba(74, 55, 40, 0.1);
  border-radius: 3px;
}

.dish-scroll::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.dish-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark);
}

.dish-grid {
  display: flex;
  gap: 20px;
  padding-bottom: 12px;
}

@media screen and (max-width: 768px) {
  .section-title {
    font-size: 22px;
  }

  .section-title::before {
    left: -12px;
  }
}
</style>
