<script setup lang="ts">
import { ref } from 'vue'
import { getPublicKey } from '@/utils/crypto'
import { http } from '@/utils/request'

const testResult = ref('')
const isLoading = ref(false)

const testPublicKey = async () => {
  isLoading.value = true
  testResult.value = '正在测试获取公钥...\n'

  try {
    console.log('测试开始：请求公钥')
    const publicKey = await getPublicKey()

    testResult.value += '✅ 获取公钥成功！\n'
    testResult.value += `公钥长度: ${publicKey.length}\n`
    testResult.value += `公钥前缀: ${publicKey.substring(0, 50)}...\n`

    console.log('获取到的公钥:', publicKey)
  } catch (error: any) {
    testResult.value += `❌ 获取公钥失败\n`
    testResult.value += `错误信息: ${error.message}\n`
    console.error('获取公钥失败:', error)
  } finally {
    isLoading.value = false
  }
}

const testDirectRequest = async () => {
  isLoading.value = true
  testResult.value = '正在测试直接请求...\n'

  try {
    const result = await http.get('/public/public-key', {}, { showError: false })
    testResult.value += '✅ 请求成功！\n'
    testResult.value += `数据类型: ${typeof result}\n`
    testResult.value += `数据长度: ${result?.length || 'N/A'}\n`
    testResult.value += `数据内容: ${String(result).substring(0, 100)}...\n`
    console.log('直接请求结果:', result)
  } catch (error: any) {
    testResult.value += `❌ 请求失败\n`
    testResult.value += `错误: ${error.message}\n`
    console.error('直接请求失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="test-page">
    <div class="container">
      <h1>API 测试页面</h1>

      <div class="test-section">
        <h2>公钥获取测试</h2>
        <button @click="testPublicKey" :disabled="isLoading" class="test-btn">
          测试获取公钥
        </button>

        <button @click="testDirectRequest" :disabled="isLoading" class="test-btn">
          测试直接请求
        </button>

        <div class="result-box">
          <pre>{{ testResult }}</pre>
        </div>
      </div>

      <div class="instructions">
        <h3>使用方法</h3>
        <ol>
          <li>打开浏览器开发者工具 (F12)</li>
          <li>切换到 Console 标签</li>
          <li>点击上面的测试按钮</li>
          <li>查看控制台输出的详细日志</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: var(--bg-primary);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px;
}

h1 {
  font-size: 28px;
  color: var(--primary-color);
  margin-bottom: 32px;
}

h2 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.test-section {
  margin-bottom: 32px;
}

.test-btn {
  padding: 12px 24px;
  margin-right: 12px;
  margin-bottom: 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.test-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-box {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: var(--radius-md);
  padding: 16px;
  margin-top: 16px;
  min-height: 200px;
}

.result-box pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
}

.instructions {
  background: rgba(255, 107, 53, 0.08);
  border-left: 4px solid var(--primary-color);
  padding: 16px;
  border-radius: var(--radius-sm);
}

.instructions ol {
  margin: 0;
  padding-left: 24px;
  color: var(--text-secondary);
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.6;
}
</style>
