<script setup lang="ts">
import { computed } from 'vue'

type ButtonType = 'primary' | 'default' | 'text' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

const props = withDefaults(defineProps<{
  type?: ButtonType
  size?: ButtonSize
  disabled?: boolean
  active?: boolean
}>(), {
  type: 'default',
  size: 'medium',
  disabled: false,
  active: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const buttonClass = computed(() => [
  'icon-btn',
  `icon-btn--${props.type}`,
  `icon-btn--${props.size}`,
  {
    'icon-btn--disabled': props.disabled,
    'icon-btn--active': props.active
  }
])

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <span class="icon-btn__icon">
      <slot name="icon" />
    </span>
    <span class="icon-btn__label">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &--small {
    padding: 10px 6px;
    min-height: 56px;
    font-size: 11px;
    border-radius: 8px;
  }

  &--medium {
    padding: 16px 8px;
    min-height: 72px;
    font-size: 12px;
    border-radius: var(--border-radius);
  }

  &--large {
    padding: 20px 12px;
    min-height: 88px;
    font-size: 13px;
    border-radius: var(--border-radius);
  }

  &--default {
    background: var(--color-background);
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover:not(:disabled) {
      background: var(--color-surface);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
  }

  &--text {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-secondary);

    &:hover:not(:disabled) {
      color: var(--color-primary);
      background: rgba(16, 185, 129, 0.08);
    }
  }

  &--danger {
    background: var(--color-error);
    border-color: var(--color-error);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__label {
    font-weight: 600;
  }
}

[data-theme="pixel"] {
  .icon-btn {
    border-radius: 0;
    border-width: 2px;
    font-weight: 700;

    &--primary,
    &--danger,
    &--active {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }

    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
    }
  }
}

[data-theme="retro"] {
  .icon-btn {
    &--primary,
    &--active {
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
    }
  }
}
</style>
