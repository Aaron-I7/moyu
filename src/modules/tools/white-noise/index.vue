<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWhiteNoise } from './composables/useWhiteNoise'

const {
  state,
  timerRemaining,
  timerPresets,
  activeSounds,
  toggleSound,
  setVolume,
  setMasterVolume,
  stopAll,
  setTimer,
  formatTime
} = useWhiteNoise()
</script>

<template>
  <div class="white-noise">
    <div class="page-header">
      <h1>白噪音</h1>
      <p>选择声音，调节音量，享受宁静时光</p>
    </div>

    <div class="sound-grid">
      <div 
        v-for="sound in state.sounds" 
        :key="sound.id"
        class="sound-card"
        :class="{ active: sound.isPlaying }"
        @click="toggleSound(sound.id)"
      >
        <div class="sound-icon">
          <Icon :icon="sound.icon" :width="32" />
        </div>
        <div class="sound-name">{{ sound.name }}</div>
        <div v-if="sound.isPlaying" class="volume-control" @click.stop>
          <input 
            type="range" 
            min="0" 
            max="100" 
            :value="sound.volume * 100"
            @input="setVolume(sound.id, Number(($event.target as HTMLInputElement).value) / 100)"
          />
        </div>
      </div>
    </div>

    <div class="controls">
      <div class="master-volume">
        <Icon icon="mdi:volume-high" :width="20" />
        <input 
          type="range" 
          min="0" 
          max="100" 
          :value="state.masterVolume * 100"
          @input="setMasterVolume(Number(($event.target as HTMLInputElement).value) / 100)"
        />
        <span>{{ Math.round(state.masterVolume * 100) }}%</span>
      </div>

      <div class="timer-control">
        <Icon icon="mdi:timer-outline" :width="20" />
        <select 
          :value="state.timer || 0"
          @change="setTimer(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="preset in timerPresets" :key="preset.value" :value="preset.value">
            {{ preset.label }}
          </option>
        </select>
        <span v-if="timerRemaining > 0" class="timer-display">
          {{ formatTime(timerRemaining) }}
        </span>
      </div>

      <button v-if="state.isPlaying" class="stop-btn" @click="stopAll">
        <Icon icon="mdi:stop" :width="20" />
        <span>停止全部</span>
      </button>
    </div>

    <div v-if="activeSounds.length > 0" class="active-info">
      <p>正在播放: {{ activeSounds.map(s => s.name).join(' + ') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.white-noise {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.sound-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: var(--card-bg);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }
  
  &.active {
    border-color: var(--primary-color);
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1));
  }
  
  .sound-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  
  .sound-name {
    font-size: 14px;
    font-weight: 500;
  }
  
  .volume-control {
    width: 100%;
    margin-top: 12px;
    padding: 0 8px;
    
    input[type="range"] {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: var(--border-color);
      outline: none;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
      }
    }
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  padding: 20px;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 16px;
  
  .master-volume,
  .timer-control {
    display: flex;
    align-items: center;
    gap: 12px;
    
    input[type="range"] {
      width: 120px;
      height: 4px;
      border-radius: 2px;
      background: var(--border-color);
      outline: none;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
      }
    }
    
    select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-color);
      cursor: pointer;
    }
    
    .timer-display {
      font-family: monospace;
      font-size: 16px;
      color: var(--primary-color);
    }
  }
  
  .stop-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #f44336;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.9;
    }
  }
}

.active-info {
  text-align: center;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 8px;
  
  p {
    color: var(--text-secondary);
    font-size: 14px;
  }
}
</style>
