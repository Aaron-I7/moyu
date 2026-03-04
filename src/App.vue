<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import GlobalBossKey from '@/components/common/GlobalBossKey.vue'
import GlobalToolMenu from '@/components/common/GlobalToolMenu.vue'
import GlobalDanmaku from '@/components/common/GlobalDanmaku.vue'
import DanmakuFab from '@/components/common/DanmakuFab.vue'
import PrivacyConsentBanner from '@/components/common/PrivacyConsentBanner.vue'
import UsageReminder from '@/components/common/UsageReminder.vue'
import AdSlot from '@/components/common/AdSlot.vue'
import { bindGestureNavigation } from '@/composables/useGestureNavigation'
import { createEnTextGuard } from '@/core/i18n/enTextGuard'
import { applyRouteSeo } from '@/core/seo'
import { adsConfig } from '@/core/ads/config'

const router = useRouter()
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const appMainRef = ref<HTMLElement | null>(null)
const enTextGuard = createEnTextGuard()
const showAds = computed(() => adsConfig.enabled && route.name !== 'NotFound')

let cleanupGesture: (() => void) | null = null

onMounted(() => {
  if (appMainRef.value) {
    cleanupGesture = bindGestureNavigation(appMainRef.value, router)
  }
  if (locale.value === 'en') {
    enTextGuard.start()
  }
})

onUnmounted(() => {
  cleanupGesture?.()
  enTextGuard.stop()
})

watch(
  () => locale.value,
  value => {
    if (value === 'en') {
      enTextGuard.start()
      enTextGuard.runFullSanitize()
    } else {
      enTextGuard.stop()
    }
    applyRouteSeo(router.currentRoute.value)
  }
)
</script>

<template>
  <div class="app-container">
    <GlobalDanmaku />
    <AppHeader />
    <main ref="appMainRef" class="app-main">
      <AdSlot v-if="showAds" slot-id="top-banner" format="leaderboard" />
      <router-view />
      <AdSlot v-if="showAds" slot-id="in-feed" format="auto" />
    </main>
    <AdSlot v-if="showAds" slot-id="sticky-bottom" format="sticky" />
    <GlobalToolMenu />
    <GlobalBossKey />
    <DanmakuFab />
    <PrivacyConsentBanner />
    <UsageReminder />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 88px;
}

.app-main {
  flex: 1;
  overflow: auto;
  padding-inline: clamp(16px, 3vw, 36px);
  padding-bottom: 28px;
}
</style>
