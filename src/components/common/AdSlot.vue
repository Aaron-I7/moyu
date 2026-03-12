<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { adsConfig } from '@/core/ads/config'

const props = defineProps<{
  slotId: 'top-banner' | 'in-feed' | 'sticky-bottom'
  format?: 'leaderboard' | 'rectangle' | 'auto' | 'sticky'
}>()

const adRef = ref<HTMLElement | null>(null)
const currentFormat = computed(() => props.format || 'auto')

// Determine if we should show external ads
const showExternalAd = computed(() => {
  return adsConfig.enabled && adsConfig.provider !== 'none'
})

// Get the specific slot ID from config
const externalAdSlotId = computed(() => {
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
  if (!adRef.value || !externalAdSlotId.value) return
  await nextTick()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
  } catch (e) {
    console.error('AdSense error:', e)
  }
}

onMounted(async () => {
  if (showExternalAd.value && adsConfig.provider === 'adsense') {
    ensureAdsenseScript()
    await requestAdsenseRender()
  }
})
</script>

<template>
  <section class="ad-slot" :class="[`ad-slot--${currentFormat}`]">
    <!-- External Ad (AdSense) -->
    <template v-if="showExternalAd && externalAdSlotId">
      <ins
        v-if="adsConfig.provider === 'adsense'"
        ref="adRef"
        class="adsbygoogle"
        style="display: block"
        :data-ad-client="adsConfig.adsenseClient"
        :data-ad-slot="externalAdSlotId"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </template>

    <!-- House Ad / Placeholder -->
    <div v-else class="house-ad">
      <div class="house-ad-content">
        <span class="house-ad-label">Promotion</span>
        <div class="house-ad-placeholder">
          <span>{{ $t('app.name') }} - {{ $t('app.heroSubtitle') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ad-slot {
  width: 100%;
  margin: 0 auto 14px;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: var(--border-radius);
  // Prevent CLS
  transition: min-height 0.3s;
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.house-ad {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.02);
  border: 1px dashed var(--color-border);
  position: relative;
  
  .house-ad-content {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    padding: 1rem;
  }

  .house-ad-label {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 9px;
    opacity: 0.5;
    text-transform: uppercase;
  }
}
</style>
