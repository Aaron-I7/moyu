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

const router = useRouter()
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })
const appMainRef = ref<HTMLElement | null>(null)
const showAds = computed(() => adsConfig.enabled && route.name !== 'NotFound' && route.name !== 'LegacyPath')
const soundEngine = useSoundEngine()

let cleanupGesture: (() => void) | null = null

onMounted(() => {
  if (appMainRef.value) {
    cleanupGesture = bindGestureNavigation(appMainRef.value, router)
  }
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
    <AmbienceModal 
      :show="soundEngine.isGlobalMixerOpen.value"
      @close="soundEngine.isGlobalMixerOpen.value = false"
    />
    <!-- PrivacyConsentBanner 已移除 -->
    <UsageReminder />
  </div>
</template>

<style scoped lang="scss">
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
</style>
