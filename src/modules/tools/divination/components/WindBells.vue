<script setup lang="ts">
defineProps<{
  ringing: boolean
}>()

const bells = [
  { ropeH: 20, idleAnim: "bellIdle0 4.2s ease-in-out infinite", ringAnim: "bellRing0 1.8s ease-in-out" },
  { ropeH: 36, idleAnim: "bellIdle1 3.5s ease-in-out 0.6s infinite", ringAnim: "bellRing1 1.8s ease-in-out 0.08s" },
  { ropeH: 26, idleAnim: "bellIdle2 5s ease-in-out 1.2s infinite", ringAnim: "bellRing2 1.8s ease-in-out 0.16s" },
]
</script>

<template>
  <div class="wind-bells">
    <div v-for="(b, i) in bells" :key="i" class="bell-group">
      <!-- 绳子 -->
      <div 
        class="rope"
        :style="{
          height: `${b.ropeH}px`,
          animation: ringing ? `ropeRing${i} 1.8s ease-in-out` : 'none'
        }"
      />
      <!-- 铃铛 -->
      <span 
        class="bell"
        :style="{
          animation: ringing ? b.ringAnim : b.idleAnim
        }"
      >🔔</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wind-bells {
  display: inline-flex;
  gap: 24px;
  align-items: flex-end;
}

.bell-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rope {
  width: 1px;
  background: linear-gradient(to bottom, rgba(150,110,35,0.5), rgba(150,110,35,0.1));
  transform-origin: top center;
}

.bell {
  font-size: 18px;
  display: block;
  transform-origin: top center;
  filter: drop-shadow(0 2px 5px rgba(150,110,20,0.35));
}
</style>
