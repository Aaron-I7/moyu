<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePomodoro } from '../composables/usePomodoro'
import { useI18n } from 'vue-i18n'

const { settings } = usePomodoro()
const { t } = useI18n({ useScope: 'global' })
const task = ref(settings.value.customTaskName)
const isFocused = ref(false)

watch(task, (newVal) => {
  settings.value.customTaskName = newVal
})
</script>

<template>
  <div class="task-input" :class="{ focused: isFocused }">
    <input
      v-model="task"
      type="text"
      :placeholder="t('pomodoro.taskPlaceholder', 'What are you working on?')"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <div class="underline"></div>
  </div>
</template>

<style scoped lang="scss">
.task-input {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 32px;
  
  input {
    width: 100%;
    padding: 12px 0;
    font-size: 24px;
    font-weight: 500;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text);
    
    &::placeholder {
      color: var(--color-text-tertiary);
      font-weight: 400;
    }
  }
  
  .underline {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--color-border);
    transform-origin: center;
    transition: transform 0.3s ease, background-color 0.3s ease;
  }
  
  &.focused .underline {
    background: var(--color-primary);
    transform: scaleX(1);
  }
}
</style>
