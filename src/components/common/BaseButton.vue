<script setup lang="ts">
import { computed } from 'vue'

type ButtonType = 'primary' | 'default' | 'text' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

const props = withDefaults(defineProps<{
  type?: ButtonType
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: boolean
  block?: boolean
}>(), {
  type: 'default',
  size: 'medium',
  disabled: false,
  loading: false,
  icon: false,
  block: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const buttonClass = computed(() => [
  'base-btn',
  `base-btn--${props.type}`,
  `base-btn--${props.size}`,
  {
    'base-btn--disabled': props.disabled || props.loading,
    'base-btn--loading': props.loading,
    'base-btn--icon': props.icon,
    'base-btn--block': props.block
  }
])

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="base-btn__loading">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </span>
    <slot />
  </button>
</template>

<style scoped lang="scss">
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  text-decoration: none;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &--small {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 6px;
  }

  &--medium {
    padding: 10px 16px;
    font-size: 14px;
    border-radius: var(--border-radius);
  }

  &--large {
    padding: 14px 24px;
    font-size: 16px;
    border-radius: var(--border-radius);
  }

  &--default {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }
  }

  &--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }
  }

  &--text {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-secondary);
    padding-left: 8px;
    padding-right: 8px;

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

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--loading {
    cursor: wait;
  }

  &--icon {
    padding: 10px;

    &.base-btn--small {
      padding: 6px;
    }

    &.base-btn--large {
      padding: 14px;
    }
  }

  &--block {
    display: flex;
    width: 100%;
  }

  &__loading {
    display: inline-flex;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

[data-theme="pixel"] {
  .base-btn {
    border-radius: 0;
    border-width: 2px;
    font-weight: 700;

    &--primary,
    &--danger {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }

    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
    }
  }
}

[data-theme="retro"] {
  .base-btn {
    &--primary {
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
    }
  }
}
</style>
