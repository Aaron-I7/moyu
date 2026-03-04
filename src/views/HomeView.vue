<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))

const mainEntries = computed(() => [
  {
    path: '/relax',
    label: t('nav.relax'),
    icon: 'mdi:spa',
    color: '#5B7BFF',
    desc: t('views.relaxDesc')
  },
  {
    path: '/games',
    label: t('nav.games'),
    icon: 'mdi:gamepad-variant',
    color: '#2B6EF2',
    desc: t('views.gamesDesc')
  },
  {
    path: '/tools',
    label: t('nav.tools'),
    icon: 'mdi:tools',
    color: '#0EA5E9',
    desc: t('views.toolsDesc')
  },
  {
    path: '/reading',
    label: t('nav.reading'),
    icon: 'mdi:book-open-page-variant',
    color: '#1D4ED8',
    desc: t('views.readingDesc')
  }
])

const heroHighlights = computed(() => [
  t('home.features.instant'),
  t('home.features.privacy'),
  t('home.features.adaptive'),
  t('home.features.free')
])

const handleNavigate = (path: string) => {
  const normalized = path === '/' ? '' : path
  router.push(`/${currentLocale.value}${normalized}`)
}
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-content">
        <p class="hero-kicker">{{ t('app.titleSuffix') }}</p>
        <h1 class="hero-title">{{ t('app.name') }}</h1>
        <p class="hero-desc">{{ t('app.heroDescription') }}</p>
        <div class="hero-highlights">
          <span v-for="item in heroHighlights" :key="item">{{ item }}</span>
        </div>
      </div>
    </section>

    <section class="entries">
      <div class="entries-grid">
        <div
          v-for="(entry, index) in mainEntries"
          :key="entry.path"
          class="entry-card"
          :style="{ '--entry-color': entry.color }"
          @click="handleNavigate(entry.path)"
        >
          <div class="entry-head">
            <div class="entry-icon" :style="{ backgroundColor: entry.color + '15', color: entry.color }">
              <Icon :icon="entry.icon" :width="28" />
            </div>
            <h3>{{ entry.label }}</h3>
            <span class="entry-badge">{{ String(index + 1).padStart(2, '0') }}</span>
          </div>
          <div class="entry-content">
            <p>{{ entry.desc }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  gap: 18px;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 16px 8px 30px;
}

.hero {
  padding: 10px 18px 2px;
  text-align: start;
  flex-shrink: 0;
  
  .hero-content {
    max-width: 100%;
    margin: 0;
    background: color-mix(in srgb, var(--color-surface) 94%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: clamp(20px, 3.2vw, 32px);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      width: 280px;
      height: 280px;
      right: -120px;
      top: -140px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      pointer-events: none;
    }
  }

  .hero-kicker {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-primary);
    margin-bottom: 10px;
  }
  
  .hero-title {
    font-size: clamp(34px, 5.2vw, 58px);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin-bottom: 10px;
    line-height: 0.98;
  }

  .hero-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    max-width: 60ch;
    line-height: 1.65;
    margin-bottom: 14px;
  }

  .hero-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    span {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    }
  }
}

.entries {
  padding: 0 18px;
}

.entries-grid {
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);
  min-height: 140px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--entry-color);
    opacity: 0.8;
  }
  
  &:hover {
    border-color: color-mix(in srgb, var(--entry-color) 45%, var(--color-border));
    transform: translateY(-3px);
    box-shadow: 0 14px 30px color-mix(in srgb, var(--entry-color) 18%, transparent);
  }

  .entry-head {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;

    h3 {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text);
      letter-spacing: -0.01em;
      line-height: 1;
    }
  }
  
  .entry-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .entry-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: color-mix(in srgb, var(--entry-color) 80%, var(--color-text-secondary));
    background: color-mix(in srgb, var(--entry-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--entry-color) 30%, transparent);
    border-radius: 999px;
    padding: 4px 8px;
  }
  
  .entry-content p {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    max-width: 36ch;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 760px) {
    min-height: 128px;

    .entry-head h3 {
      font-size: 22px;
    }
  }
}

[data-theme="night"] {
  .hero .hero-content,
  .entry-card {
    background: color-mix(in srgb, var(--color-surface) 82%, transparent);
    border-color: color-mix(in srgb, var(--color-border) 92%, #0a1220);
  }

  .hero .hero-content::after {
    background: color-mix(in srgb, var(--color-secondary) 18%, transparent);
  }

  .hero .hero-highlights span {
    background: color-mix(in srgb, var(--color-surface) 80%, transparent);
  }

  .entry-card .entry-icon {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, white 18%, transparent);
  }
}

[data-theme="pixel"] {
  .hero .hero-content,
  .entry-card {
    border-radius: 0;
    border-width: 2px;
    box-shadow: none;
  }

  .hero .hero-content::after {
    display: none;
  }

  .hero .hero-highlights span,
  .entry-card .entry-badge {
    border-radius: 0;
    border-width: 2px;
  }

  .entry-card .entry-icon {
    border-radius: 0;
    border: 2px solid var(--color-border);
  }

  .entry-card:hover {
    transform: translate(-2px, -2px);
  }
}

</style>
