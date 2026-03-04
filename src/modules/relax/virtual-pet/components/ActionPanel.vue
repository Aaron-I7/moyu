<template>
  <section class="action-panel">
    <IconButton
      v-for="btn in buttons"
      :key="btn.action"
      :type="btn.active ? 'primary' : 'default'"
      :disabled="!btn.enabled"
      :active="btn.active"
      :title="btn.tip"
      @click="handleAction(btn.action)"
    >
      <template #icon>
        <SvgIcon :name="btn.icon" :size="18" />
      </template>
      {{ btn.label }}
    </IconButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SvgIcon from './SvgIcon.vue'
import IconButton from '@/components/common/IconButton.vue'
import type { PetType } from '../stores/pet'

type IconName = 'food' | 'smile' | 'bolt' | 'drop' | 'play' | 'feed' | 'bath' | 'paw' | 'moon' | 'sun' | 'feather' | 'walk' | 'carrot'
type ActionName = 'feed' | 'play' | 'pet' | 'sleep' | 'wakeUp' | 'bath' | 'special'

const props = defineProps({
  petType: { type: String as () => PetType, default: 'cat' },
  canFeed: { type: Boolean, default: true },
  canPlay: { type: Boolean, default: true },
  canPet: { type: Boolean, default: true },
  canSleep: { type: Boolean, default: true },
  canBath: { type: Boolean, default: true },
  isSleeping: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'feed'): void
  (e: 'play'): void
  (e: 'pet'): void
  (e: 'sleep'): void
  (e: 'wakeUp'): void
  (e: 'bath'): void
  (e: 'special'): void
}>()
const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

interface Button {
  action: ActionName
  icon: IconName
  label: string
  enabled: boolean
  tip: string
  active?: boolean
}

function handleAction(action: ActionName) {
  if (action === 'special') {
    emit('special')
  } else {
    emit(action as any)
  }
}

const specialButton = computed<{ action: ActionName; icon: IconName; label: string; tip: string }>(() => {
  switch (props.petType) {
    case 'cat':
      return isEn.value
        ? { action: 'special', icon: 'feather', label: 'Tease', tip: 'Play with a feather toy' }
        : { action: 'special', icon: 'feather', label: '逗弄', tip: '用羽毛逗它玩' }
    case 'dog':
      return isEn.value
        ? { action: 'special', icon: 'walk', label: 'Walk', tip: 'Go for a short walk' }
        : { action: 'special', icon: 'walk', label: '遛狗', tip: '带它出去散步' }
    case 'rabbit':
      return isEn.value
        ? { action: 'special', icon: 'carrot', label: 'Treat', tip: 'Give a carrot snack' }
        : { action: 'special', icon: 'carrot', label: '喂零食', tip: '给它吃胡萝卜' }
    default:
      return isEn.value
        ? { action: 'special', icon: 'paw', label: 'Interact', tip: 'Interact with your pet' }
        : { action: 'special', icon: 'paw', label: '互动', tip: '和它互动' }
  }
})

const buttons = computed<Button[]>(() => {
  return [
    { action: 'feed', icon: 'feed', label: isEn.value ? 'Feed' : '喂食', enabled: props.canFeed, tip: props.canFeed ? (isEn.value ? 'Feed' : '喂食') : (isEn.value ? 'Cannot feed now' : '现在不能喂食') },
    { action: 'play', icon: 'play', label: isEn.value ? 'Play' : '玩耍', enabled: props.canPlay, tip: props.canPlay ? (isEn.value ? 'Play' : '玩耍') : (isEn.value ? 'Low energy' : '体力不足') },
    { action: 'pet', icon: 'paw', label: isEn.value ? 'Pet' : '抚摸', enabled: props.canPet, tip: props.canPet ? (isEn.value ? 'Pet' : '抚摸') : (isEn.value ? 'Sleeping now' : '正在睡觉') },
    { ...specialButton.value, enabled: !props.isSleeping },
    props.isSleeping
      ? { action: 'wakeUp', icon: 'sun', label: isEn.value ? 'Wake' : '唤醒', enabled: true, tip: isEn.value ? 'Wake up' : '叫醒它', active: true }
      : { action: 'sleep', icon: 'moon', label: isEn.value ? 'Sleep' : '睡觉', enabled: props.canSleep, tip: isEn.value ? 'Let it rest' : '让它休息' },
    { action: 'bath', icon: 'bath', label: isEn.value ? 'Bath' : '洗澡', enabled: props.canBath, tip: props.canBath ? (isEn.value ? 'Bath' : '洗澡') : (isEn.value ? 'Sleeping now' : '正在睡觉') },
  ]
})
</script>

<style scoped lang="scss">
.action-panel {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  background: var(--color-surface);
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

@media (max-width: 600px) {
  .action-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
