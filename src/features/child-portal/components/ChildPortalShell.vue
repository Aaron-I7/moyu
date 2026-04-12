<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getDisplayName } from '@/features/child-portal/helpers'
import type {
  ChildLevelProgress,
  ChildPortalNavItem,
  ChildPortalOverview,
  ChildProfile,
  PortalSection
} from '@/features/child-portal/types'

const props = defineProps<{
  canRetryWithPortalLink: boolean
  childProfile: Partial<ChildProfile>
  currentPoints: number
  errorMessage: string
  levelProgress: ChildLevelProgress
  navItems: readonly ChildPortalNavItem[]
  overview: ChildPortalOverview
  portalExpiryText: string
  section: PortalSection
  successMessage: string
}>()

const emit = defineEmits<{
  navigate: [section: PortalSection]
  retry: []
}>()

const displayName = computed(() => getDisplayName(props.childProfile))
const avatarLabel = computed(() => displayName.value.slice(0, 1))

</script>

<template>
  <div class="portal-shell">
    <div class="portal-shell__bg"></div>

    <!-- HUD 顶部悬浮 -->
    <header class="portal-hud">
      <div class="portal-hud__left">
        <div class="portal-hud__avatar">
          <img
            v-if="childProfile.avatar_url"
            :src="childProfile.avatar_url"
            :alt="`${displayName} 的头像`"
          />
          <span v-else>{{ avatarLabel }}</span>
        </div>
        <div class="portal-hud__info">
          <h1>{{ displayName }}</h1>
          <div class="portal-hud__badges">
            <span class="portal-hud__badge portal-hud__badge--level">
              <Icon icon="ph:crown-simple-fill" />
              {{ levelProgress.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="portal-hud__right">
        <span class="portal-hud__expiry">
          <Icon icon="ph:hourglass-medium-duotone" />
          {{ portalExpiryText }}
        </span>
        <div class="portal-hud__stars">
          <Icon icon="ph:shooting-star-fill" />
          <strong>{{ currentPoints }}</strong>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="portal-main">
      <div v-if="errorMessage" class="portal-banner portal-banner--error">
        <span>{{ errorMessage }}</span>
        <button v-if="canRetryWithPortalLink" type="button" @click="emit('retry')">重试</button>
      </div>
      <div v-if="successMessage" class="portal-banner portal-banner--success">
        <span>{{ successMessage }}</span>
      </div>

      <div class="portal-main__content">
        <slot />
      </div>
    </main>

    <!-- 底部 Dock 导航 -->
    <nav class="portal-dock" aria-label="儿童入口导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        class="portal-dock__item"
        :class="{ 'portal-dock__item--active': section === item.key }"
        :style="{ '--portal-accent': item.accent }"
        @click="emit('navigate', item.key)"
      >
        <span class="portal-dock__icon">
          <Icon :icon="item.icon" />
        </span>
        <span class="portal-dock__label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
@use '../adventure-theme.scss' as theme;

.portal-shell {
  --portal-amber: #ffaa00;
  --portal-sky: #42baff;
  --portal-mint: #4cdb5e;
  --portal-rose: #ff725c;
  --portal-ink: #1a2a40;
  --portal-shell-side-padding: 24px;
  --portal-dock-item-size: 72px;
  --portal-dock-gap: 12px;
  --portal-dock-padding: 12px;
  --portal-dock-bottom: 24px;
  --portal-dock-radius: 32px;
  --portal-main-bottom-padding: calc(
    var(--portal-dock-bottom) +
    (var(--portal-dock-padding) * 2) +
    var(--portal-dock-item-size) +
    28px
  );
  
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eef7ff;
  color: var(--portal-ink);
  overflow-x: hidden;
}

.portal-shell__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: 
    radial-gradient(circle at 10% 20%, rgba(255, 230, 160, 0.6) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(135, 220, 255, 0.4) 0%, transparent 40%);
  z-index: 0;
}

/* HUD 样式 */
.portal-hud {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px var(--portal-shell-side-padding);
  gap: 16px;
  pointer-events: none; /* 让中间部分可穿透点击 */
}

.portal-hud__left, .portal-hud__right {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.portal-hud__avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ffde82, #ff9b3e);
  color: #553000;
  font-size: 28px;
  font-weight: 900;
  border: 4px solid white;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.portal-hud__info {
  display: flex;
  flex-direction: column;
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
    color: #1b3a57;
    text-shadow: 0 2px 4px rgba(255,255,255,0.8);
  }
}

.portal-hud__badges {
  margin-top: 4px;
}

.portal-hud__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  background: white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.06);
}

.portal-hud__badge--level {
  color: #ff9100;
  svg { font-size: 16px; }
}

.portal-hud__expiry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  color: #5a7592;
  font-size: 14px;
  font-weight: 800;
}

.portal-hud__stars {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffdf6d, #ffae34);
  color: #603400;
  box-shadow: 0 6px 12px rgba(255, 150, 0, 0.2);
  border: 3px solid white;
  
  svg {
    font-size: 24px;
  }
  strong {
    font-size: 22px;
    line-height: 1;
  }
}

/* 主体内容 */
.portal-main {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 var(--portal-shell-side-padding) var(--portal-main-bottom-padding);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.portal-main__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 底部 Dock */
.portal-dock {
  position: fixed;
  bottom: var(--portal-dock-bottom);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: var(--portal-dock-gap);
  padding: var(--portal-dock-padding);
  border-radius: var(--portal-dock-radius);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  box-shadow: 0 16px 40px rgba(20, 50, 80, 0.12), inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.portal-dock__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: var(--portal-dock-item-size);
  height: var(--portal-dock-item-size);
  border-radius: 20px;
  color: #7b94b0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &:hover {
    transform: translateY(-4px);
    background: rgba(240, 246, 255, 0.8);
  }
}

.portal-dock__item--active {
  color: white;
  background: var(--portal-accent, #42baff);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--portal-accent) 40%, transparent);
  transform: translateY(-8px);
  
  &:hover {
    transform: translateY(-10px);
    background: var(--portal-accent);
  }
}

.portal-dock__icon {
  font-size: 32px;
}

.portal-dock__label {
  font-size: 13px;
  font-weight: 800;
}

/* Banner 提示 */
.portal-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 20px;
  border-radius: 20px;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
}

.portal-banner--error {
  background: #ffeded;
  color: #d13d22;
  button {
    padding: 6px 12px;
    border-radius: 999px;
    background: white;
    color: inherit;
    font-weight: 800;
  }
}

.portal-banner--success {
  background: #ecfdf0;
  color: #2b9e44;
}

@include theme.respond-max(phone) {
  .portal-shell {
    --portal-shell-side-padding: 16px;
    --portal-dock-item-size: 60px;
    --portal-dock-gap: clamp(6px, 2vw, 10px);
    --portal-dock-padding: 10px;
    --portal-dock-bottom: 16px;
    --portal-dock-radius: 28px;
    --portal-main-bottom-padding: calc(
      var(--portal-dock-bottom) +
      (var(--portal-dock-padding) * 2) +
      var(--portal-dock-item-size) +
      30px
    );
  }

  .portal-hud {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }

  .portal-hud__left,
  .portal-hud__right {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }

  .portal-hud__avatar {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    font-size: 24px;
  }

  .portal-hud__info h1 {
    font-size: clamp(20px, 5.8vw, 26px);
  }

  .portal-hud__badge {
    font-size: 13px;
  }

  .portal-hud__expiry {
    flex: 1 1 auto;
    min-width: 0;
    justify-content: center;
    font-size: 13px;
  }

  .portal-hud__stars {
    padding: 6px 14px;

    svg {
      font-size: 22px;
    }

    strong {
      font-size: 20px;
    }
  }

  .portal-dock {
    width: calc(100% - 32px);
    justify-content: space-between;
  }

  .portal-dock__item {
    min-width: 0;
    border-radius: 18px;
  }

  .portal-dock__item--active {
    transform: translateY(-6px);
  }

  .portal-dock__icon {
    font-size: 28px;
  }

  .portal-dock__label {
    font-size: 12px;
  }
}

@include theme.respond-max(narrow) {
  .portal-shell {
    --portal-shell-side-padding: 12px;
    --portal-dock-item-size: 56px;
    --portal-dock-gap: 2px;
    --portal-dock-padding: 8px;
    --portal-dock-bottom: 12px;
    --portal-dock-radius: 24px;
  }

  .portal-hud__left {
    gap: 10px;
  }

  .portal-hud__avatar {
    width: 52px;
    height: 52px;
    border-width: 3px;
    border-radius: 16px;
    font-size: 22px;
  }

  .portal-hud__info h1 {
    font-size: 18px;
  }

  .portal-hud__badge {
    padding: 4px 8px;
    font-size: 12px;
  }

  .portal-hud__expiry {
    font-size: 12px;
    padding: 6px 10px;
  }

  .portal-hud__stars {
    padding: 6px 11px;

    svg {
      font-size: 18px;
    }

    strong {
      font-size: 18px;
    }
  }

  .portal-dock {
    width: calc(100% - 24px);
  }

  .portal-dock__item {
    flex: 1 1 0;
    gap: 3px;
    border-radius: 16px;
  }

  .portal-dock__item--active {
    transform: translateY(-4px);
  }

  .portal-dock__icon {
    font-size: 24px;
  }

  .portal-dock__label {
    font-size: 11px;
  }
}
</style>
