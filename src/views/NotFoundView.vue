<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found">
    <div class="content">
      <Icon icon="mdi:emoticon-sad" :width="80" />
      <h1>404</h1>
      <p>页面未找到</p>
      <button class="back-btn" @click="goHome">
        <Icon icon="mdi:home" :width="20" />
        <span>返回首页</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  
  .content {
    text-align: center;
    
    h1 {
      font-size: 64px;
      font-weight: 700;
      margin: 16px 0;
      color: var(--text-color);
    }
    
    p {
      font-size: 18px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
    
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--primary-color);
      color: white;
      border-radius: 8px;
      font-size: 16px;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>
