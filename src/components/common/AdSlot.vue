<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { adsConfig } from '@/core/ads/config'

const props = defineProps<{
  slotId: 'top-banner' | 'in-feed' | 'sticky-bottom'
  format?: 'leaderboard' | 'rectangle' | 'auto' | 'sticky'
}>()

const adRef = ref<HTMLElement | null>(null)
const currentFormat = computed(() => props.format || 'auto')
const adSlot = computed(() => {
  if (props.slotId === 'top-banner') return adsConfig.slots.topBanner
  if (props.slotId === 'in-feed') return adsConfig.slots.inFeed
  return adsConfig.slots.stickyBottom
})

function ensureAdsenseScript() {
  if (!adsConfig.adsenseClient) return
  if (document.querySelector('script[data-adsense="true"]')) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.adsenseClient}`
  script.crossOrigin = 'anonymous'
  script.dataset.adsense = 'true'
  document.head.appendChild(script)
}

async function requestAdsenseRender() {
  if (adsConfig.provider !== 'adsense') return
  if (!adRef.value || !adSlot.value) return
  await nextTick()
  ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
}

onMounted(async () => {
  if (!adsConfig.enabled) return
  if (adsConfig.provider === 'adsense') {
    ensureAdsenseScript()
    await requestAdsenseRender()
  }
})
</script>

<template>
  <section v-if="adsConfig.enabled" class="ad-slot" :class="[`ad-slot--${currentFormat}`]">
    <ins
      v-if="adsConfig.provider === 'adsense' && adSlot"
      ref="adRef"
      class="adsbygoogle"
      style="display: block"
      :data-ad-client="adsConfig.adsenseClient"
      :data-ad-slot="adSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
    <div v-else class="ad-slot-placeholder" />
  </section>
</template>

<style scoped lang="scss">
.ad-slot {
  width: 100%;
  margin: 0 auto 14px;
  overflow: hidden;
}

.ad-slot--leaderboard {
  min-height: 90px;
}

.ad-slot--rectangle {
  min-height: 250px;
}

.ad-slot--auto {
  min-height: 120px;
}

.ad-slot--sticky {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 45;
  margin: 0;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border-top: 1px solid var(--color-border);
  min-height: 64px;
}

.ad-slot-placeholder {
  width: 100%;
  height: 100%;
  min-height: inherit;
}
</style>
