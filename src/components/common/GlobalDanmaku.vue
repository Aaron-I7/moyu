<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue'
import { getRandomDanmaku } from '@/data/danmakuContent'
import { useWebSocketDanmaku } from '@/composables/useWebSocketDanmaku'

interface DisplayDanmaku {
  id: string
  content: string
  emoji?: string
  userName?: string
  timestamp: number
  track: number
  color: string
  speed: number
  isUser: boolean
  isPaused: boolean
  isHovered: boolean
}

const isPaused = ref(false)
const danmakuList = ref<DisplayDanmaku[]>([])
const hoveredDanmakuId = ref<string | null>(null)

const {
  isConnected,
  onlineCount,
  receivedMessages,
  danmakuEnabled,
  loadDanmakuEnabled
} = useWebSocketDanmaku()

const TRACK_COUNT = 6
const TRACK_HEIGHT = 60
const MIN_SPEED = 10
const MAX_SPEED = 18

const trackUsage = reactive<number[]>(new Array(TRACK_COUNT).fill(0))

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9'
]

function getRandomColor(): string {
  const index = Math.floor(Math.random() * COLORS.length)
  return COLORS[index] ?? '#FFFFFF'
}

function getAvailableTrack(): number {
  const now = Date.now()
  let bestTrack = 0
  let minUsage = Infinity
  
  for (let i = 0; i < TRACK_COUNT; i++) {
    const usage = trackUsage[i] ?? 0
    if (usage < now - 2000) {
      return i
    }
    if (usage < minUsage) {
      minUsage = usage
      bestTrack = i
    }
  }
  
  return bestTrack
}

function createDisplayDanmaku(
  content: string,
  options: {
    emoji?: string
    userName?: string
    isUser?: boolean
  } = {}
): DisplayDanmaku {
  const track = getAvailableTrack()
  trackUsage[track] = Date.now()
  
  return {
    id: `danmaku_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    emoji: options.emoji,
    userName: options.userName,
    timestamp: Date.now(),
    track,
    color: options.isUser ? '#FFD700' : getRandomColor(),
    speed: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
    isUser: options.isUser || false,
    isPaused: false,
    isHovered: false
  }
}

function addDanmaku(content: string, options: {
  emoji?: string
  userName?: string
  isUser?: boolean
} = {}) {
  if (!danmakuEnabled.value) return
  
  const danmaku = createDisplayDanmaku(content, options)
  danmakuList.value.push(danmaku)
}

function addSystemDanmaku() {
  if (!danmakuEnabled.value || isPaused.value) return
  
  const systemDanmaku = getRandomDanmaku()
  addDanmaku(systemDanmaku.content, {
    emoji: systemDanmaku.emoji
  })
}

function onAnimationEnd(danmakuId: string) {
  const index = danmakuList.value.findIndex(d => d.id === danmakuId)
  if (index !== -1) {
    danmakuList.value.splice(index, 1)
  }
}

function handleDanmakuHover(danmakuId: string, hoverState: boolean) {
  const danmaku = danmakuList.value.find(d => d.id === danmakuId)
  if (!danmaku) return
  
  danmaku.isHovered = hoverState
  danmaku.isPaused = hoverState
  hoveredDanmakuId.value = hoverState ? danmakuId : null
}

function togglePause() {
  isPaused.value = !isPaused.value
  
  danmakuList.value.forEach(d => {
    d.isPaused = isPaused.value
  })
  
  if (!isPaused.value) {
    scheduleSystemDanmaku()
  }
}

let systemTimer: number | null = null

function scheduleSystemDanmaku() {
  if (systemTimer) {
    clearTimeout(systemTimer)
  }
  
  if (!danmakuEnabled.value || isPaused.value) return
  
  systemTimer = window.setTimeout(() => {
    addSystemDanmaku()
    scheduleSystemDanmaku()
  }, 8000 + Math.random() * 12000)
}

function processPendingMessages() {
  while (receivedMessages.value.length > 0) {
    const message = receivedMessages.value.shift()
    if (message) {
      addDanmaku(message.content, {
        emoji: message.emoji,
        userName: message.userName,
        isUser: true
      })
    }
  }
}

watch(receivedMessages, () => {
  if (danmakuEnabled.value) {
    processPendingMessages()
  }
}, { deep: true })

onMounted(() => {
  loadDanmakuEnabled()
  
  if (danmakuEnabled.value && !isPaused.value) {
    setTimeout(() => {
      addSystemDanmaku()
      scheduleSystemDanmaku()
    }, 2000)
  }
})

onUnmounted(() => {
  if (systemTimer) {
    clearTimeout(systemTimer)
  }
})
</script>

<template>
  <Transition name="danmaku-fade">
    <div
      v-if="danmakuEnabled"
      class="danmaku-screen"
      :class="{ 'danmaku-screen--paused': isPaused }"
    >
      <div class="danmaku-tracks">
        <div
          v-for="trackIndex in TRACK_COUNT"
          :key="trackIndex"
          class="danmaku-track"
          :style="{ top: `${(trackIndex - 1) * TRACK_HEIGHT + 60}px` }"
        />
      </div>

      <TransitionGroup name="danmaku-item" tag="div" class="danmaku-layer">
        <div
          v-for="danmaku in danmakuList"
          :key="danmaku.id"
          class="danmaku-item"
          :class="{
            'danmaku-item--user': danmaku.isUser,
            'danmaku-item--hovered': danmaku.isHovered
          }"
          :style="{
            top: `${danmaku.track * TRACK_HEIGHT + 60}px`,
            '--duration': `${danmaku.speed}s`,
            '--color': danmaku.color,
            animationPlayState: danmaku.isPaused ? 'paused' : 'running'
          }"
          @animationend="onAnimationEnd(danmaku.id)"
          @mouseenter="handleDanmakuHover(danmaku.id, true)"
          @mouseleave="handleDanmakuHover(danmaku.id, false)"
        >
          <div class="danmaku-inner">
            <span v-if="danmaku.emoji" class="danmaku-emoji">{{ danmaku.emoji }}</span>
            <span class="danmaku-text">{{ danmaku.content }}</span>
            <Transition name="author-fade">
              <span v-if="danmaku.isHovered && danmaku.userName" class="danmaku-author">
                — {{ danmaku.userName }}
              </span>
            </Transition>
          </div>
          
          <Transition name="tooltip-fade">
            <div v-if="danmaku.isHovered" class="danmaku-tooltip">
              <span class="tooltip-time">
                {{ new Date(danmaku.timestamp).toLocaleTimeString('zh-CN') }}
              </span>
              <span v-if="danmaku.isUser" class="tooltip-badge">用户弹幕</span>
            </div>
          </Transition>
        </div>
      </TransitionGroup>

      <div class="danmaku-controls">
        <button
          v-if="isConnected"
          class="control-btn control-btn--online"
          :title="`${onlineCount}人在线`"
        >
          <span class="online-dot" />
          <span>{{ onlineCount }}</span>
        </button>
        
        <button
          class="control-btn"
          :title="isPaused ? '继续播放' : '暂停'"
          @click="togglePause"
        >
          <span v-if="isPaused">▶</span>
          <span v-else>⏸</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.danmaku-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  pointer-events: none;
  overflow: hidden;
}

.danmaku-tracks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.danmaku-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 60px;
  pointer-events: none;
}

.danmaku-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.danmaku-item {
  position: absolute;
  left: 100%;
  animation: danmaku-scroll var(--duration) linear forwards;
  pointer-events: auto;
  cursor: default;
  
  --duration: 12s;
  --color: #fff;
}

@keyframes danmaku-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100vw - 100%));
  }
}

.danmaku-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(20, 20, 40, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.danmaku-item--hovered .danmaku-inner {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 60, 0.95) 0%,
    rgba(50, 30, 80, 0.95) 100%
  );
  border-color: var(--color);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 20px color-mix(in srgb, var(--color) 40%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: scale(1.08);
  z-index: 100;
}

.danmaku-item--user .danmaku-inner {
  border-color: rgba(255, 215, 0, 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 165, 0, 0.2) 100%
  );
}

.danmaku-item--user.danmaku-item--hovered .danmaku-inner {
  border-color: #FFD700;
  box-shadow: 
    0 8px 32px rgba(255, 215, 0, 0.3),
    0 0 30px rgba(255, 215, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.danmaku-emoji {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  line-height: 1;
}

.danmaku-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--color);
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 20px color-mix(in srgb, var(--color) 30%, transparent);
  letter-spacing: 1px;
}

.danmaku-author {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.danmaku-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  white-space: nowrap;
  z-index: 101;
}

.tooltip-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.tooltip-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 4px;
  color: #000;
  font-weight: 600;
}

.danmaku-controls {
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  pointer-events: auto;
  z-index: 9999;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

.danmaku-screen:hover .danmaku-controls {
  opacity: 1;
  transform: translateX(0);
}

.control-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &--close:hover {
    background: rgba(255, 77, 77, 0.3);
    border-color: rgba(255, 77, 77, 0.5);
  }
  
  &--online {
    font-size: 12px;
    gap: 4px;
    width: auto;
    padding: 0 12px;
  }
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #10B981;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

.danmaku-fade-enter-active,
.danmaku-fade-leave-active {
  transition: opacity 0.3s ease;
}

.danmaku-fade-enter-from,
.danmaku-fade-leave-to {
  opacity: 0;
}

.danmaku-item-move {
  transition: transform 0.3s ease;
}

.danmaku-item-leave-active {
  transition: opacity 0.2s ease;
}

.danmaku-item-leave-to {
  opacity: 0;
}

.author-fade-enter-active,
.author-fade-leave-active {
  transition: all 0.2s ease;
}

.author-fade-enter-from,
.author-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

@media (max-width: 768px) {
  .danmaku-inner {
    padding: 8px 16px;
    gap: 6px;
  }
  
  .danmaku-emoji {
    font-size: 20px;
  }
  
  .danmaku-text {
    font-size: 16px;
  }
  
  .danmaku-author {
    font-size: 12px;
  }
  
  .control-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
    
    &--online {
      width: auto;
      padding: 0 10px;
      font-size: 11px;
    }
  }
}

@media (max-width: 480px) {
  .danmaku-inner {
    padding: 6px 12px;
    gap: 4px;
  }
  
  .danmaku-emoji {
    font-size: 18px;
  }
  
  .danmaku-text {
    font-size: 14px;
  }
}
</style>
