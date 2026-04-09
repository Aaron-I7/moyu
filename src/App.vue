<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import GlobalBossKey from '@/components/common/GlobalBossKey.vue'
import GlobalToolMenu from '@/components/common/GlobalToolMenu.vue'
import GlobalDanmaku from '@/components/common/GlobalDanmaku.vue'
import DanmakuFab from '@/components/common/DanmakuFab.vue'
import UsageReminder from '@/components/common/UsageReminder.vue'
import AdSlot from '@/components/common/AdSlot.vue'
import { bindGestureNavigation } from '@/composables/useGestureNavigation'
import { applyRouteSeo } from '@/core/seo'
import { adsConfig } from '@/core/ads/config'
import AmbienceModal from '@/modules/tools/pomodoro/components/AmbienceModal.vue'
import { useSoundEngine } from '@/modules/tools/pomodoro/composables/useSoundEngine'
import { useVersionCheck } from '@/composables/useVersionCheck'

const router = useRouter()
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const appMainRef = ref<HTMLElement | null>(null)
const isBlankLayout = computed(() => route.meta.layout === 'blank')
const isPortalLayout = computed(() => route.meta.layout === 'portal')
const hideChrome = computed(() => isBlankLayout.value || isPortalLayout.value)
const showAds = computed(() => adsConfig.enabled && !hideChrome.value && route.name !== 'NotFound' && route.name !== 'LegacyPath')
const soundEngine = useSoundEngine()
const { hasNewVersion, startChecking, refresh } = useVersionCheck()

let cleanupGesture: (() => void) | null = null

const refreshGestureBinding = () => {
  cleanupGesture?.()
  cleanupGesture = null

  if (!appMainRef.value || hideChrome.value) {
    return
  }

  cleanupGesture = bindGestureNavigation(appMainRef.value, router)
}

onMounted(() => {
  startChecking()
  refreshGestureBinding()
})

onUnmounted(() => {
  cleanupGesture?.()
})

watch(
  () => locale.value,
  () => {
    applyRouteSeo(router.currentRoute.value)
  }
)

watch(
  () => hideChrome.value,
  () => {
    refreshGestureBinding()
  }
)
</script>

<template>
  <div class="app-container">
    <GlobalDanmaku v-if="!hideChrome" />
    <AppHeader v-if="!hideChrome" />
    <main
      ref="appMainRef"
      class="app-main"
      :class="{
        'app-main--portal': isPortalLayout
      }"
    >
      <AdSlot v-if="showAds" slot-id="top-banner" format="leaderboard" />
      <router-view />
      <AdSlot v-if="showAds" slot-id="in-feed" format="auto" />
    </main>
    <AdSlot v-if="showAds" slot-id="sticky-bottom" format="sticky" />
    <GlobalToolMenu v-if="!hideChrome" />
    <GlobalBossKey v-if="!hideChrome" />
    <DanmakuFab v-if="!hideChrome" />
    <AmbienceModal
      v-if="!hideChrome"
      :show="soundEngine.isGlobalMixerOpen.value"
      @close="soundEngine.isGlobalMixerOpen.value = false"
    />
    <!-- PrivacyConsentBanner 已移除 -->
    <UsageReminder v-if="!hideChrome" />
    <div v-if="hasNewVersion && !hideChrome" class="update-toast">
      <div class="update-content">
        <span class="update-title">{{ $t('notification.updateTitle') }}</span>
        <span class="update-desc">{{ $t('notification.updateDesc') }}</span>
      </div>
      <button class="update-btn" @click="refresh">{{ $t('notification.refresh') }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.update-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
  padding: 16px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;

  .update-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .update-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
  }

  .update-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .update-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    transition: var(--transition);

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  }
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  overflow: auto;
  padding-inline: clamp(16px, 3vw, 36px);
  padding-top: 12px;
  padding-bottom: 30px;
}

.app-main--portal {
  padding: 0;
}
</style>
