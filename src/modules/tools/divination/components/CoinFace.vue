<script setup lang="ts">
defineProps<{
  yang: boolean
}>()
</script>

<template>
  <svg viewBox="0 0 48 48" width="48" height="48" class="coin-face">
    <defs>
      <radialGradient id="cg" cx="38%" cy="32%">
        <stop offset="0%" stop-color="#f5d870"/>
        <stop offset="55%" stop-color="#c8a030"/>
        <stop offset="100%" stop-color="#8a6010"/>
      </radialGradient>
      <radialGradient id="cgedge" cx="50%" cy="50%">
        <stop offset="70%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(80,50,0,0.25)"/>
      </radialGradient>
    </defs>
    <circle cx="24" cy="24" r="23" fill="url(#cg)"/>
    <circle cx="24" cy="24" r="23" fill="url(#cgedge)"/>
    <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(100,70,10,0.3)" stroke-width="0.7"/>
    <rect x="17.5" y="17.5" width="13" height="13" rx="1.2" fill="#c09028" stroke="rgba(80,50,0,0.4)" stroke-width="0.8"/>
    <rect x="19.5" y="19.5" width="9" height="9" rx="0.6" fill="#2a1800"/>
    
    <template v-if="yang">
      <text x="24" y="15" text-anchor="middle" fill="rgba(60,35,0,0.7)" font-size="5" font-family="serif">元</text>
      <text x="24" y="36" text-anchor="middle" fill="rgba(60,35,0,0.7)" font-size="5" font-family="serif">寶</text>
      <text x="10" y="26.5" text-anchor="middle" fill="rgba(60,35,0,0.7)" font-size="5" font-family="serif">通</text>
      <text x="38" y="26.5" text-anchor="middle" fill="rgba(60,35,0,0.7)" font-size="5" font-family="serif">行</text>
    </template>
    
    <template v-else>
      <path d="M6 24 Q15 19 24 24 Q33 29 42 24" fill="none" stroke="rgba(100,70,10,0.25)" stroke-width="1"/>
      <path d="M6 24 Q15 29 24 24 Q33 19 42 24" fill="none" stroke="rgba(100,70,10,0.25)" stroke-width="1"/>
    </template>
    
    <ellipse cx="17" cy="15" rx="5" ry="3" fill="rgba(255,240,180,0.2)" transform="rotate(-20,17,15)"/>
  </svg>
</template>

<style scoped>
.coin-face {
  display: block;
}
</style>
