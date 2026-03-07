<script setup lang="ts">
import CoinFace from './CoinFace.vue'

const props = defineProps<{
  tossing: boolean
  coins: boolean[] // Array of 3 booleans: true = Yang (Head), false = Yin (Tail)
}>()

// Animation configurations
const coinConfig = [
  { delay: '0ms', duration: '0.8s' },
  { delay: '100ms', duration: '0.9s' },
  { delay: '200ms', duration: '1.0s' }
]
</script>

<template>
  <div class="coin-toss-container">
    <div 
      v-for="(config, i) in coinConfig" 
      :key="i"
      class="coin-wrapper"
    >
      <div 
        class="coin-inner"
        :class="{
          'is-tossing': tossing,
          'is-head': props.coins[i],
          'is-tail': !props.coins[i]
        }"
        :style="tossing ? { 
          animationDelay: config.delay,
          animationDuration: config.duration
        } : {}"
      >
        <!-- Front (Yang/Head) -->
        <div class="coin-side front">
          <CoinFace :yang="true" />
        </div>
        <!-- Back (Yin/Tail) -->
        <div class="coin-side back">
          <CoinFace :yang="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.coin-toss-container {
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px; 
  z-index: 10;
}

.coin-wrapper {
  width: 64px; 
  height: 64px;
  perspective: 1000px;
  position: relative;
}

.coin-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out;
}

.coin-inner.is-tossing {
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

.coin-inner.is-tossing.is-head {
  animation-name: toss-jump-head;
}

.coin-inner.is-tossing.is-tail {
  animation-name: toss-jump-tail;
}

.coin-inner.is-head {
  transform: rotateY(0deg);
}

.coin-inner.is-tail {
  transform: rotateY(180deg);
}

@keyframes toss-jump-head {
  0% { transform: translateY(0) rotateY(0deg) scale(1); }
  50% { transform: translateY(-120px) rotateY(900deg) scale(1.2); } 
  100% { transform: translateY(0) rotateY(1800deg) scale(1); } /* 5 full spins, lands on Front */
}

@keyframes toss-jump-tail {
  0% { transform: translateY(0) rotateY(0deg) scale(1); }
  50% { transform: translateY(-120px) rotateY(990deg) scale(1.2); } /* Spin a bit more */
  100% { transform: translateY(0) rotateY(1980deg) scale(1); } /* 5.5 spins, lands on Back */
}

.coin-side {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 50%;
}

.coin-side.back {
  transform: rotateY(180deg);
}
</style>
