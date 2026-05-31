<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})
</script>

<template>
  <div class="loading-container" :class="[`loading-${size}`]">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p class="loading-text">加载中...</p>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-spinner {
  position: relative;
  display: inline-block;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  border-top-color: var(--primary-color);
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  width: 75%;
  height: 75%;
  top: 12.5%;
  left: 12.5%;
  border-right-color: var(--secondary-color);
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  width: 50%;
  height: 50%;
  top: 25%;
  left: 25%;
  border-bottom-color: var(--primary-light);
  animation-delay: -0.15s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.loading-small .spinner-ring {
  border-width: 2px;
}

.loading-small .loading-text {
  font-size: 12px;
  margin-top: 12px;
}

.loading-large .spinner-ring {
  border-width: 4px;
}

.loading-large .loading-text {
  font-size: 16px;
  margin-top: 20px;
}
</style>
