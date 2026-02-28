<script setup lang="ts">
import { useWoodenFish } from './composables/useWoodenFish'
import woodenFishImg from '@/assets/images/wooden-fish/muyu.webp'
import hammerImg from '@/assets/images/wooden-fish/hammer.png'

const {
  state,
  floatingTexts,
  knock,
  toggleAutoMode,
  setAutoSpeed,
  toggleSound,
  toggleVibration,
  resetCount
} = useWoodenFish()
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>敲木鱼</h1>
        <p>敲击木鱼，积累功德，放松身心</p>
      </div>

      <div class="game-area">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ state.count }}</span>
            <span class="stat-label">功德</span>
          </div>
        </div>

        <div class="wooden-fish-container">
          <button 
            class="wooden-fish"
            @click="knock"
            @touchstart.prevent="knock($event)"
          >
            <img :src="woodenFishImg" alt="木鱼" class="fish-img" />
            <img 
              :src="hammerImg" 
              alt="木槌" 
              class="hammer-img"
              :class="{ 'hammer-knock': state.count > 0 }"
            />
          </button>
          
          <TransitionGroup name="float">
            <div 
              v-for="text in floatingTexts" 
              :key="text.id"
              class="floating-text"
              :style="{ left: text.x + 'px', top: text.y + 'px' }"
            >
              {{ text.text }}
            </div>
          </TransitionGroup>
        </div>

        <p class="hint">点击木鱼或按空格键积攒功德</p>

        <div class="controls">
          <div class="control-row">
            <button 
              class="control-btn"
              :class="{ active: state.autoMode }"
              @click="toggleAutoMode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>{{ state.autoMode ? '停止' : '自动' }}</span>
            </button>
            
            <button 
              class="control-btn"
              :class="{ active: state.soundEnabled }"
              @click="toggleSound"
            >
              <svg v-if="state.soundEnabled" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              <span>音效</span>
            </button>
            
            <button 
              class="control-btn"
              :class="{ active: state.vibrationEnabled }"
              @click="toggleVibration"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6 12a6 6 0 0 0 12 0"></path><path d="M12 2v2"></path><path d="M12 20v2"></path></svg>
              <span>震动</span>
            </button>
          </div>

          <div v-if="state.autoMode" class="speed-control">
            <label>速度</label>
            <input 
              type="range" 
              min="50" 
              max="500" 
              :value="state.autoSpeed"
              @input="setAutoSpeed(Number(($event.target as HTMLInputElement).value))"
            />
            <span>{{ state.autoSpeed }}ms</span>
          </div>

          <button class="reset-btn" @click="resetCount">
            重置功德
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-top: 56px;
}

.page-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  margin-bottom: 24px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  p {
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.stats {
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-value {
      font-size: 48px;
      font-weight: 700;
      color: var(--color-primary);
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
  }
}

.wooden-fish-container {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

.wooden-fish {
  position: relative;
  width: 220px;
  height: 220px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.96);
  }
  
  .fish-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  
  .hammer-img {
    position: absolute;
    top: -20px;
    right: -10px;
    width: 80px;
    height: 80px;
    object-fit: contain;
    transform: rotate(-30deg);
    transform-origin: bottom left;
    transition: transform 0.1s ease;
    pointer-events: none;
  }
  
  &:active .hammer-img {
    transform: rotate(10deg);
  }
}

.hint {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
}

.floating-text {
  position: fixed;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
}

.float-enter-active {
  animation: floatUp 1.5s ease-out forwards;
}

.float-leave-active {
  transition: opacity 0.3s ease;
}

.float-leave-to {
  opacity: 0;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1.2);
  }
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.control-row {
  display: flex;
  gap: 12px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--border-radius);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  
  label {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  input[type="range"] {
    width: 120px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-border);
    outline: none;
    
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-primary);
      cursor: pointer;
    }
  }
  
  span {
    font-size: 13px;
    color: var(--color-text-secondary);
    min-width: 50px;
  }
}

.reset-btn {
  padding: 10px 24px;
  border-radius: var(--border-radius);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }
}

[data-theme="pixel"] {
  .wooden-fish {
    image-rendering: pixelated;
    
    &:active {
      transform: translate(4px, 4px) scale(0.96);
    }
  }
  
  .control-btn, .reset-btn {
    border-radius: 0;
    border-width: 2px;
    
    &.active {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }
  }
  
  .speed-control {
    border-radius: 0;
    border-width: 2px;
  }
}

[data-theme="retro"] {
  .wooden-fish {
    filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.4));
    
    &:active {
      filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.6));
    }
  }
  
  .floating-text {
    text-shadow: 0 0 10px var(--color-primary);
  }
  
  .control-btn.active {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
  }
}

@media (max-width: 480px) {
  .wooden-fish {
    width: 180px;
    height: 180px;
    
    .hammer-img {
      width: 60px;
      height: 60px;
    }
  }
  
  .stats .stat-item .stat-value {
    font-size: 40px;
  }
}
</style>
