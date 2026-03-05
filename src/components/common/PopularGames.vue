<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const currentLocale = computed(() => (route.params.locale === 'zh' ? 'zh' : 'en'))

const games = computed(() => [
  {
    id: 'pixel-fishing',
    name: t('modules.pixelFishing.name'),
    desc: t('modules.pixelFishing.description'),
    icon: 'mdi:fishbowl',
    color: '#3B82F6',
    path: '/games/pixel-fishing'
  }
])

const handleNavigate = (game: any) => {
  if (game.path && game.path.startsWith('/')) {
    router.push(`/${currentLocale.value}${game.path}`)
  }
}
</script>

<template>
  <div class="popular-games">
    <div class="section-header">
      <h2 class="section-title">
        <Icon icon="mdi:gamepad-variant" class="title-icon" />
        {{ t('home.popularGames') }}
      </h2>
      <button class="more-btn" @click="handleNavigate({ path: '/games' })">
        {{ t('common.more') }} <Icon icon="mdi:chevron-right" />
      </button>
    </div>
    
    <div class="games-grid">
      <div 
        v-for="game in games" 
        :key="game.id" 
        class="game-card"
        @click="handleNavigate(game)"
        :style="{ '--game-color': game.color }"
      >
        <div class="game-icon">
          <Icon :icon="game.icon" width="24" />
        </div>
        <div class="game-info">
          <h3 class="game-name">{{ game.name }}</h3>
          <p class="game-desc">{{ game.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.popular-games {
  margin-top: 24px;
  padding: 0 18px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 8px;
    
    .title-icon {
      color: #3B82F6;
    }
  }
  
  .more-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
    
    &:hover {
      background: color-mix(in srgb, var(--color-text-secondary) 10%, transparent);
      color: var(--color-primary);
    }
  }
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--game-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--game-color) 15%, transparent);
    
    .game-icon {
      background: var(--game-color);
      color: white;
    }
  }
  
  .game-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--game-color) 15%, transparent);
    color: var(--game-color);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .game-info {
    flex: 1;
    min-width: 0;
    
    .game-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
    }
    
    .game-desc {
      font-size: 12px;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

@media (max-width: 600px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
}
</style>