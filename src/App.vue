<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import GlobalBossKey from '@/components/common/GlobalBossKey.vue'
import GlobalToolMenu from '@/components/common/GlobalToolMenu.vue'
import GlobalDanmaku from '@/components/common/GlobalDanmaku.vue'
import DanmakuFab from '@/components/common/DanmakuFab.vue'
import PrivacyConsentBanner from '@/components/common/PrivacyConsentBanner.vue'
import UsageReminder from '@/components/common/UsageReminder.vue'
import { bindGestureNavigation } from '@/composables/useGestureNavigation'
import { createEnTextGuard } from '@/core/i18n/enTextGuard'

const router = useRouter()
const { locale } = useI18n()
const appMainRef = ref<HTMLElement | null>(null)
const enTextGuard = createEnTextGuard()

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
  }
)
</script>

<template>
  <div class="app-container">
    <GlobalDanmaku />
    <AppHeader />
    <main ref="appMainRef" class="app-main">
      <router-view />
    </main>
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
