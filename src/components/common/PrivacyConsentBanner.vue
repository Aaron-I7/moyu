<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  acceptAllConsent,
  loadConsent,
  rejectOptionalConsent,
  saveConsent,
  useConsentState
} from '@/core/privacy/consent'

const { t } = useI18n()
const { consentReady, consentState } = useConsentState()

const showManage = ref(false)

const analytics = ref(false)
const personalization = ref(false)
const social = ref(false)

loadConsent()

const shouldShowBanner = computed(() => !consentReady.value)

function syncFromState(): void {
  analytics.value = consentState.value.analytics
  personalization.value = consentState.value.personalization
  social.value = consentState.value.social
}

syncFromState()

function handleAcceptAll(): void {
  acceptAllConsent()
  syncFromState()
}

function handleRejectOptional(): void {
  rejectOptionalConsent()
  syncFromState()
}

function handleSave(): void {
  saveConsent({
    analytics: analytics.value,
    personalization: personalization.value,
    social: social.value
  })
  showManage.value = false
}
</script>

<template>
  <Transition name="consent">
    <section v-if="shouldShowBanner" class="consent-banner">
      <div class="content">
        <h3>{{ t('privacy.title') }}</h3>
        <p>{{ t('privacy.desc') }}</p>

        <div v-if="showManage" class="settings">
          <label>
            <input v-model="analytics" type="checkbox">
            <span>{{ t('privacy.analytics') }}</span>
          </label>
          <label>
            <input v-model="personalization" type="checkbox">
            <span>{{ t('privacy.personalization') }}</span>
          </label>
          <label>
            <input v-model="social" type="checkbox">
            <span>{{ t('privacy.social') }}</span>
          </label>
        </div>

        <div class="actions">
          <a class="action-link ghost" @click="showManage = !showManage">{{ t('privacy.manage') }}</a>
          <a class="action-link ghost" @click="handleRejectOptional">{{ t('privacy.rejectOptional') }}</a>
          <a v-if="showManage" class="action-link primary" @click="handleSave">{{ t('privacy.save') }}</a>
          <a v-else class="action-link primary" @click="handleAcceptAll">{{ t('privacy.acceptAll') }}</a>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped lang="scss">
.consent-banner {
  position: fixed;
  inset-inline: 16px;
  bottom: 16px;
  z-index: 1200;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.content {
  padding: 16px;

  h3 {
    font-size: 15px;
    color: var(--color-text);
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-bottom: 12px;
  }
}

.settings {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text);
  }
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .action-link {
    cursor: pointer;
    border-radius: 10px;
    padding: 8px 12px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
  }

  .ghost {
    border-color: var(--color-border);
    color: var(--color-text-secondary);
    background: transparent;
  }

  .primary {
    background: var(--color-primary);
    color: #fff;
  }
}

.consent-enter-active,
.consent-leave-active {
  transition: 0.2s ease;
}

.consent-enter-from,
.consent-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
