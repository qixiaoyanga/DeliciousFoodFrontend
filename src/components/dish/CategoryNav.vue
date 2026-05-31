<script setup lang="ts">
import { ref } from 'vue'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  selectedId?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: 1
})

const emit = defineEmits<{
  (e: 'select', category: Category): void
}>()

const selectedCategory = ref(props.selectedId)

const handleSelect = (category: Category) => {
  selectedCategory.value = category.id
  emit('select', category)
}
</script>

<template>
  <div class="category-nav">
    <div class="category-scroll">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.id }"
        @click="handleSelect(category)"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">{{ category.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-nav {
  width: 100%;
  overflow: hidden;
}

.category-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  min-width: 100px;
  cursor: pointer;
  border: 2px solid transparent;
}

.category-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.category-item:active {
  transform: translateY(-2px);
}

.category-item.active {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.05);
}

.category-icon {
  font-size: 32px;
  line-height: 1;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.category-item.active .category-name {
  color: var(--primary-color);
}

.category-count {
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(74, 55, 40, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
}

.category-item.active .category-count {
  background: rgba(255, 107, 53, 0.15);
  color: var(--primary-color);
}

@media screen and (max-width: 768px) {
  .category-item {
    min-width: 80px;
    padding: 12px 16px;
  }

  .category-icon {
    font-size: 28px;
  }

  .category-name {
    font-size: 13px;
  }
}
</style>
