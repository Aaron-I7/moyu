<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })

const goHome = () => {
  const locale = route.params.locale === 'zh' ? 'zh' : 'en'
  router.push(`/${locale}`)
}
</script>

<template>
  <div class="not-found">
    <div class="content">
      <Icon icon="mdi:emoticon-sad" :width="80" />
      <h1>404</h1>
      <p>{{ t('notFound.title') }}</p>
      <button class="back-btn" @click="goHome">
        <Icon icon="mdi:home" :width="20" />
        <span>{{ t('notFound.backHome') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  
  .content {
    text-align: center;
    
    h1 {
      font-size: 64px;
      font-weight: 700;
      margin: 16px 0;
      color: var(--color-text);
    }
    
    p {
      font-size: 18px;
      color: var(--color-text-secondary);
      margin-bottom: 24px;
    }
    
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--color-primary);
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
