<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { shareToPlatform } from '@/core/social/share'

const { t } = useI18n()

const sharePayload = {
  title: 'Breakflow',
  text: 'Breakflow — a global micro-break app for young professionals.',
  url: window.location.origin
}

async function share(platform: 'x' | 'tiktok' | 'instagram') {
  await shareToPlatform(platform, sharePayload)
}

async function copyLink() {
  await navigator.clipboard.writeText(sharePayload.url)
}
</script>

<template>
  <div class="share-panel">
    <h4>{{ t('share.title') }}</h4>
    <p>{{ t('share.subtitle') }}</p>
    <div class="actions">
      <button @click="share('x')">{{ t('share.x') }}</button>
      <button @click="share('tiktok')">{{ t('share.tiktok') }}</button>
      <button @click="share('instagram')">{{ t('share.instagram') }}</button>
      <button @click="copyLink">{{ t('share.copy') }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.share-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  width: 260px;
  box-shadow: var(--shadow);

  h4 {
    color: var(--color-text);
    margin-bottom: 4px;
    font-size: 14px;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 12px;
    margin-bottom: 10px;
  }
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  button {
    border-radius: 8px;
    border: 1px solid var(--color-border);
    padding: 8px 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
    background: var(--color-background);

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}
</style>
