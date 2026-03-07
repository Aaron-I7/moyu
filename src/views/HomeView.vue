<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import SharedDivinationCard from '@/components/common/SharedDivinationCard.vue'
import PopularTools from '@/components/common/PopularTools.vue'
import PopularGames from '@/components/common/PopularGames.vue'
import PopularRelax from '@/components/common/PopularRelax.vue'

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

const highlightChips = computed(() => [
  t('home.features.instant'),
  t('home.features.privacy'),
  t('home.features.adaptive'),
  t('home.features.free')
])

const handleNavigate = (path: string) => {
  const normalized = path === '/' ? '' : path
  router.push(`/${currentLocale.value}${normalized}`)
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
      <div class="hero-aura hero-aura-left" />
      <div class="hero-aura hero-aura-right" />
      <div class="hero-content moyu-panel">
        <p class="hero-kicker">{{ t('app.titleSuffix') }}</p>
        <h1 class="hero-title" :class="{
          'text-gradient-orange': timeState === 'morning',
          'text-gradient': timeState === 'afternoon',
          'text-gradient-mint': timeState === 'night'
        }">{{ t('app.name') }}</h1>
        <p class="hero-desc">{{ t('app.heroSubtitle') }}</p>
        <button class="hero-about-entry-inline" @click="handleNavigate('/about')">
          <Icon icon="mdi:compass-outline" :width="16" />
          <span>{{ t('routeTitle.about') }}</span>
        </button>
        <div class="hero-highlights">
          <span v-for="item in highlightChips" :key="item">{{ item }}</span>
        </div>
      </div>
      
      <div class="hero-sidebar">
        <div class="hover-lift">
          <SharedDivinationCard />
        </div>
        <button class="ask-spring-card hover-lift" @click="handleNavigate('/tools/divination')">
          <img src="/images/divination/遇事不决%20可问春风.png" alt="遇事不决 可问春风" />
          <div class="card-overlay">
            <div class="overlay-content">
              <span class="card-action">
                <Icon icon="mdi:sparkles" />
                <span>问</span>
              </span>
              <p class="poetic-text">春风不语，即随本心</p>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="entries">
      <div class="entries-grid">
        <div
          v-for="(entry, index) in mainEntries"
          :key="entry.path"
          class="entry-card moyu-panel"
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

    <PopularTools />
    <PopularGames />
    <PopularRelax />

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
  padding: 8px 18px 2px;
  text-align: start;
  flex-shrink: 0;
  display: flex;
  gap: 16px;
  position: relative;
  overflow: hidden;
  border-radius: calc(var(--border-radius) + 8px);
  
  .hero-content {
    flex: 1;
    max-width: 100%;
    margin: 0;
    background: color-mix(in srgb, var(--color-surface) 94%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: clamp(20px, 3.2vw, 32px);
    box-shadow: 0 8px 24px rgba(86, 70, 149, 0.08);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;

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

    &::before {
      content: '';
      position: absolute;
      inset: auto -20% -120px auto;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      filter: blur(8px);
      pointer-events: none;
    }
  }
  
  .hero-sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    flex-direction: column;
    
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
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    max-width: 60ch;
    line-height: 1.5;
    margin-bottom: 14px;
  }

  .hero-highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    span {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text);
      border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
      border-radius: 999px;
      padding: 7px 12px;
      background: color-mix(in srgb, var(--color-surface) 84%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, white 22%, transparent);
    }
  }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.45; }
  50% { transform: scale(1.1); opacity: 0.6; }
}

.hero-aura {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(44px);
  opacity: 0.45;
  pointer-events: none;
  animation: breathe 8s infinite ease-in-out;
}

.hero.morning {
  .hero-aura-left {
    background: color-mix(in srgb, var(--color-mint) 40%, transparent);
    animation-delay: 0s;
  }
  .hero-aura-right {
    background: color-mix(in srgb, var(--color-orange) 34%, transparent);
    animation-delay: -4s;
  }
}

.hero.afternoon {
  .hero-aura-left {
    background: color-mix(in srgb, var(--color-primary) 40%, transparent);
  }
  .hero-aura-right {
    background: color-mix(in srgb, var(--color-secondary) 34%, transparent);
  }
}

.hero.night {
  .hero-aura-left {
    background: color-mix(in srgb, #4F46E5 40%, transparent);
  }
  .hero-aura-right {
    background: color-mix(in srgb, #7C3AED 34%, transparent);
  }
}

.hero-aura-left {
  left: -120px;
  top: -80px;
  background: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.hero-aura-right {
  right: -90px;
  bottom: -120px;
  background: color-mix(in srgb, var(--color-accent) 34%, transparent);
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
  @extend .hero-about-entry;
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
    transform: translateY(-5px);
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

  .hero-aura {
    opacity: 0.3;
  }

  .hero-about-entry {
    background: color-mix(in srgb, var(--color-surface) 72%, transparent);
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

  .hero-about-entry {
    border-radius: 0;
    border-width: 2px;
  }
}

</style>
