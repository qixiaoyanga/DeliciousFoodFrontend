<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/common/NavBar.vue'
import Footer from '@/components/common/Footer.vue'
import Toast from '@/components/common/Toast.vue'
import { registerToast } from '@/utils/toast'

const route = useRoute()
const toastRef = ref<InstanceType<typeof Toast>>()

const showNavFooter = computed(() => {
  return route.meta.showNavFooter !== false
})

onMounted(() => {
  if (toastRef.value) {
    registerToast(toastRef.value)
  }
})
</script>

<template>
  <div id="app">
    <NavBar v-if="showNavFooter" />
    <main class="main-content">
      <RouterView />
    </main>
    <Footer v-if="showNavFooter" />
    <Toast ref="toastRef" />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
