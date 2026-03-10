<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import SharedDivinationCard from '@/components/common/SharedDivinationCard.vue'
import DivinationQuickModal from '@/components/common/DivinationQuickModal.vue'
import PopularTools from '@/components/common/PopularTools.vue'
import PopularGames from '@/components/common/PopularGames.vue'
import PopularRelax from '@/components/common/PopularRelax.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))
const quickDivinationVisible = ref(false)

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

const highlightChips = computed(() => [
  { id: 'instant', label: t('home.features.instant'), icon: 'mdi:flash-outline' },
  { id: 'privacy', label: t('home.features.privacy'), icon: 'mdi:incognito' },
  { id: 'adaptive', label: t('home.features.adaptive'), icon: 'mdi:devices' },
  { id: 'free', label: t('home.features.free'), icon: 'mdi:cash-remove' }
])

const handleNavigate = (path: string) => {
  const normalized = path === '/' ? '' : path
  router.push(`/${currentLocale.value}${normalized}`)
}

const openQuickDivination = () => {
  quickDivinationVisible.value = true
}

const hour = new Date().getHours()
const timeState = computed(() => {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'night'
})
</script>

<template>
  <div class="home-page moyu-page">
    <section class="hero" :class="timeState">
      <div class="hero-content moyu-panel">
        <div class="hero-text">
          <p class="hero-kicker">{{ t('app.titleSuffix') }}</p>
          <h1 class="hero-title" :class="{
            'text-gradient-orange': timeState === 'morning',
            'text-gradient': timeState === 'afternoon',
            'text-gradient-mint': timeState === 'night'
          }">{{ t('app.name') }}</h1>
          <p class="hero-desc">{{ t('app.heroSubtitle') }}</p>
        </div>
        <div class="hero-actions">
          <button class="hero-focus-entry-inline" @click="handleNavigate('/tools/focus')">
            <Icon icon="mdi:leaf" :width="18" />
            <span>{{ t('home.focusModeCta') }}</span>
          </button>
          <button class="hero-about-entry-inline" @click="handleNavigate('/about')">
            <Icon icon="mdi:compass-outline" :width="16" />
            <span>{{ t('routeTitle.about') }}</span>
          </button>
        </div>
        <div class="hero-highlights">
          <span v-for="item in highlightChips" :key="item.id">
            <Icon :icon="item.icon" :width="16" />
            <span>{{ item.label }}</span>
          </span>
        </div>
      </div>
      
      <div class="hero-sidebar">
        <div class="hover-lift">
          <SharedDivinationCard />
        </div>
        <button class="ask-spring-card hover-lift" @click="openQuickDivination">
          <img src="/images/divination/遇事不决%20可问春风.png" alt="遇事不决 可问春风" />
          <div class="card-overlay">
            <div class="overlay-content">
              <span class="card-action">
                <Icon icon="mdi:sparkles" />
                <span>{{ t('modules.divination.ask') }}</span>
              </span>
              <p class="poetic-text">{{ t('modules.divination.teaser') }}</p>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="entries">
      <div class="entries-grid">
        <button
          v-for="entry in mainEntries"
          :key="entry.path"
          type="button"
          class="entry-quick moyu-panel"
          :style="{ '--entry-color': entry.color }"
          :title="entry.desc"
          @click="handleNavigate(entry.path)"
        >
          <span class="entry-icon" :style="{ backgroundColor: entry.color + '15', color: entry.color }">
            <Icon :icon="entry.icon" :width="20" />
          </span>
          <span class="entry-label">{{ entry.label }}</span>
        </button>
      </div>
    </section>

    <PopularTools />
    <PopularGames />
    <PopularRelax />
    <DivinationQuickModal v-model="quickDivinationVisible" />

  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  gap: 22px;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 18px 10px 34px;
}

.hero {
  padding: 14px 18px;
  text-align: start;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 252px;
  gap: 22px;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  border-radius: calc(var(--border-radius) + 8px);
  
  .hero-content {
    max-width: 100%;
    margin: 0;
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-surface) 92%, transparent) 0%,
        color-mix(in srgb, var(--color-surface) 86%, transparent) 52%,
        color-mix(in srgb, var(--color-surface) 55%, transparent) 70%,
        rgba(255, 255, 255, 0) 100%
      ),
      url('/hero.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 0 0, left bottom;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: clamp(26px, 3.8vw, 44px);
    box-shadow: 0 8px 24px rgba(86, 70, 149, 0.08);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    min-height: 320px;

    &::after,
    &::before {
      content: none;
    }
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 58ch;
  }

  .hero-actions {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
  }

  .hero-focus-entry-inline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 16px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, #14B8A6 62%, transparent);
    background: linear-gradient(
      135deg,
      rgba(20, 184, 166, 0.22) 0%,
      rgba(13, 148, 136, 0.16) 50%,
      rgba(249, 115, 22, 0.10) 100%
    );
    color: var(--color-text);
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    box-shadow:
      0 10px 30px rgba(20, 184, 166, 0.14),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);

    svg {
      opacity: 0.95;
    }

    &:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, #14B8A6 70%, transparent);
      box-shadow:
        0 14px 40px rgba(20, 184, 166, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    }
  }
  
  .hero-sidebar {
    width: 252px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-self: stretch;
  }

  .ask-spring-card {
    width: 100%;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid var(--color-border);
    padding: 0;
    background: transparent;
    cursor: pointer;
    transition: var(--transition);
    position: relative;
    
    img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(2px);
    }

    .overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .poetic-text {
      color: rgba(255, 255, 255, 0.95);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 2px;
      transform: translateY(10px);
      transition: transform 0.4s ease 0.1s, opacity 0.4s ease 0.1s;
      opacity: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      height: 120px;
      position: absolute;
      right: 24px;
      top: 50%;
      margin-top: -60px;
    }

    .card-action {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-radius: 999px;
      color: var(--color-primary);
      font-weight: 600;
      font-size: 14px;
      transform: translateY(10px);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    &:hover {
      border-color: var(--color-primary);
      
      img {
        transform: scale(1.05);
      }

      .card-overlay {
        opacity: 1;
      }

      .card-action {
        transform: translateY(0);
      }

      .poetic-text {
        transform: translateY(0);
        opacity: 1;
      }
    }
  }

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 16px;
    
    .hero-sidebar {
      width: 100%;
    }
  }

  .hero-kicker {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-primary);
    margin: 0;
  }

  .hero-title {
    font-size: clamp(34px, 5.2vw, 58px);
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin: 0;
    line-height: 1;
  }

  .hero-desc {
    font-size: 18px;
    font-weight: 650;
    color: color-mix(in srgb, var(--color-text) 92%, var(--color-text-secondary));
    max-width: 60ch;
    line-height: 1.65;
    margin: 0;
  }

  .hero-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 650;
      color: color-mix(in srgb, var(--color-text) 82%, var(--color-text-secondary));
      background: color-mix(in srgb, var(--color-surface) 72%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
      border-radius: 999px;
      line-height: 1.1;
      user-select: none;
      pointer-events: none;
      cursor: default;

      svg {
        opacity: 0.9;
      }

      span {
        padding: 0;
        border: none;
        background: transparent;
        border-radius: 0;
      }
    }
  }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.45; }
  50% { transform: scale(1.1); opacity: 0.6; }
}


.hero-about-entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  text-align: left;
  padding: 8px 12px;
  margin: 0 0 14px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  border-radius: 999px;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
  transition: var(--transition);

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 48%, var(--color-border));
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
    color: var(--color-primary);
  }
}

.hero-about-entry-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  text-align: left;
  padding: 9px 8px;
  margin: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  text-underline-offset: 5px;
  border-radius: 10px;

  &:hover {
    color: var(--color-primary);
    text-decoration-color: color-mix(in srgb, var(--color-primary) 65%, transparent);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-primary) 60%, transparent);
    outline-offset: 2px;
  }
}

.entries {
  padding: 0 18px;
}

.entries-grid {
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  
  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
}

.entry-quick {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
  min-height: 52px;
  justify-content: flex-start;
  width: 100%;

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
    box-shadow: 0 10px 20px color-mix(in srgb, var(--entry-color) 14%, transparent);
  }
  
  .entry-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .entry-label {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.01em;
    line-height: 1;
  }
}

[data-theme="night"] {
  .hero .hero-content,
  .entry-quick {
    background: color-mix(in srgb, var(--color-surface) 82%, transparent);
    border-color: color-mix(in srgb, var(--color-border) 92%, #0a1220);
  }

  .hero .hero-content::after {
    background: color-mix(in srgb, var(--color-secondary) 18%, transparent);
  }

  .entry-quick .entry-icon {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, white 18%, transparent);
  }

  .hero-aura {
    opacity: 0.3;
  }

  .hero-about-entry-inline {
    color: color-mix(in srgb, var(--color-text) 70%, var(--color-text-secondary));
    text-decoration-color: color-mix(in srgb, var(--color-primary) 28%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    }
  }
}

[data-theme="pixel"] {
  .hero .hero-content,
  .entry-quick {
    border-radius: 0;
    border-width: 2px;
    box-shadow: none;
  }

  .hero .hero-content::after {
    display: none;
  }

  .hero .hero-highlights span {
    border-radius: 0;
    border-width: 2px;
    border-style: solid;
  }

  .entry-quick .entry-icon {
    border-radius: 0;
    border: 2px solid var(--color-border);
  }

  .entry-quick:hover {
    transform: translate(-2px, -2px);
  }

  .hero-about-entry-inline {
    border-radius: 0;
    border: 2px solid var(--color-border);
    text-decoration: none;
    padding: 8px 10px;
    background: var(--color-surface);
  }
}

</style>
