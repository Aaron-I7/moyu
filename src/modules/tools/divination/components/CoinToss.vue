<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CoinFace from './CoinFace.vue'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const stage = ref<'fly' | 'land'>('fly')

// 生成随机动画参数
const coinData = [0, 1, 2].map(i => ({
  yang: Math.random() < 0.5,
  dx: (Math.random() - 0.5) * 140,
  peakY: -(55 + Math.random() * 50),
  rot: (720 + Math.floor(Math.random() * 3) * 360) * (Math.random() < 0.5 ? 1 : -1),
  dur: 700 + i * 60,
  delay: i * 80,
  // 动态生成 keyframes 名称
  animName: `ct${i}_${Math.random().toString(36).substr(2, 5)}`
}))

let t1: any, t2: any

onMounted(() => {
  const maxDur = Math.max(...coinData.map(c => c.dur + c.delay))
  
  t1 = setTimeout(() => {
    stage.value = 'land'
  }, maxDur - 100)
  
  t2 = setTimeout(() => {
    emit('complete')
  }, maxDur + 400)
})

onUnmounted(() => {
  clearTimeout(t1)
  clearTimeout(t2)
})
</script>

<template>
  <div class="coin-toss-container">
    <div 
      v-for="(c, i) in coinData" 
      :key="i"
      class="coin-wrapper"
      :style="{
        animation: stage === 'fly' ? `${c.animName} ${c.dur}ms cubic-bezier(.15,.85,.35,1) ${c.delay}ms both` : 'none'
      }"
    >
      <!-- 动态样式注入 -->
      <component is="style">
        @keyframes {{ c.animName }} {
          0% { transform: translate(0,0) rotateY(0deg) scale(0.9); opacity: 0.7; }
          35% { transform: translate({{ c.dx * 0.45 }}px, {{ c.peakY }}px) rotateY({{ c.rot * 0.45 }}deg) scale(1.2); opacity: 1; }
          100% { transform: translate({{ c.dx }}px, 0) rotateY({{ c.rot }}deg) scale(1); opacity: 1; }
        }
      </component>
      
      <div 
        class="coin-inner"
        :class="{ 'is-landed': stage === 'land' }"
      >
        <CoinFace :yang="c.yang" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.coin-toss-container {
  position: relative;
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 18px;
}

.coin-inner {
  transition: transform 0.3s ease, filter 0.3s;
  filter: drop-shadow(0 1px 3px rgba(150,110,20,0.2));
  
  &.is-landed {
    transform: scale(1.05);
    filter: drop-shadow(0 3px 6px rgba(150,110,20,0.45));
  }
}
</style>
