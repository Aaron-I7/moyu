<script setup lang="ts">
import { onMounted, ref } from 'vue'

const petals = ref<any[]>([])

onMounted(() => {
  petals.value = [...Array(8)].map((_, i) => ({
    id: i,
    char: ["🌸", "🍃", "🌿", "✦", "❧"][i % 5],
    left: `${5 + Math.random() * 90}%`,
    top: `${-8 + Math.random() * 20}%`,
    size: 9 + Math.random() * 8,
    dur: 11 + Math.random() * 13,
    delay: Math.random() * 12,
    tx: `${(Math.random() - 0.5) * 180}px`,
    ty: `${55 + Math.random() * 110}px`,
    tr: `${(Math.random() - 0.5) * 55}deg`,
  }))
})
</script>

<template>
  <div class="petals-container">
    <div 
      v-for="p in petals" 
      :key="p.id"
      class="petal"
      :style="{
        left: p.left,
        top: p.top,
        fontSize: `${p.size}px`,
        color: p.char === '✦' ? 'rgba(190,160,60,0.25)' : 'rgba(120,90,25,0.22)',
        animation: `leafDrift ${p.dur}s ease-in ${p.delay}s infinite`,
        '--tx': p.tx,
        '--ty': p.ty,
        '--tr': p.tr
      }"
    >
      {{ p.char }}
    </div>
  </div>
</template>

<style scoped>
.petals-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.petal {
  position: absolute;
}
</style>
