<template>
  <Transition name="bubble">
    <div v-if="visible" class="speech">
      <span class="text">{{ currentMessage }}</span>
      <div class="tail"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePetMessages } from '../composables/usePetMessages'
import type { PetType } from '../stores/pet'

const props = defineProps({
  state: { type: String, default: 'idle' },
  petType: { type: String as () => PetType, default: 'cat' },
})

const { getMessage } = usePetMessages()
const currentMessage = ref(getMessage(props.state, props.petType))
const visible = ref(true)

let intervalId: ReturnType<typeof setInterval> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

function refresh() {
  visible.value = false
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    currentMessage.value = getMessage(props.state, props.petType)
    visible.value = true
  }, 220)
}

watch(() => props.state, refresh)
watch(() => props.petType, refresh)

onMounted(() => {
  intervalId = setInterval(refresh, 6000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (refreshTimer) clearTimeout(refreshTimer)
})
</script>

<style scoped lang="scss">
.speech {
  position: relative;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 12px 20px;
  max-width: 240px;
  text-align: center;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

.text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.tail {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--color-border);
}

.tail::after {
  content: '';
  position: absolute;
  left: -9px;
  top: -10px;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid var(--color-surface);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
