<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { ModuleConfig } from '@/core/module/types'

const props = defineProps<{
  config: ModuleConfig
  size?: number
}>()

const iconSize = computed(() => props.size || 48)

const renderType = computed(() => {
  const { iconType } = props.config
  return iconType || 'iconify'
})
</script>

<template>
  <div class="module-icon">
    <Icon 
      v-if="renderType === 'iconify'" 
      :icon="(config.icon as string)"
      :width="iconSize"
      :height="iconSize"
    />
    <img 
      v-else-if="renderType === 'image' || renderType === 'svg'"
      :src="(config.icon as string)"
      :width="iconSize"
      :height="iconSize"
      :alt="config.name"
    />
  </div>
</template>

<style scoped lang="scss">
.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
