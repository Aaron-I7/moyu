<script setup lang="ts">
import { onMounted, ref } from 'vue'

const streaks = ref<any[]>([])

onMounted(() => {
  streaks.value = [...Array(7)].map((_, i) => ({
    id: i,
    top: `${15 + Math.random() * 70}%`,
    width: 40 + Math.random() * 80,
    dur: 3 + Math.random() * 4,
    delay: Math.random() * 6,
    opacity: 0.04 + Math.random() * 0.07,
    thick: Math.random() < 0.3 ? 1.5 : 0.8,
  }))
})
</script>

<template>
  <div class="wind-streaks-container">
    <div 
      v-for="s in streaks" 
      :key="s.id"
      class="streak"
      :style="{
        top: s.top,
        width: `${s.width}px`,
        height: `${s.thick}px`,
        animation: `windStreak ${s.dur}s ease-in-out ${s.delay}s infinite`,
        '--wo': s.opacity
      }"
    />
  </div>
</template>

<style scoped>
.wind-streaks-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.streak {
  position: absolute;
  left: 0;
  background: linear-gradient(90deg, transparent, rgba(160,130,60,0.6), transparent);
  border-radius: 2px;
}
</style>
