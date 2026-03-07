<script setup lang="ts">
import { computed } from 'vue'
import type { LineVal } from '../data'
import { YAO_MAP } from '../data'

const props = defineProps<{
  yao: LineVal
  idx: number
  show: boolean
}>()

const info = computed(() => YAO_MAP[props.yao])
const label = computed(() => ["初", "二", "三", "四", "五", "上"][props.idx])

const gold = computed(() => info.value.moving ? "#c05820" : "#c09028")
const glow = computed(() => info.value.moving ? "0 0 8px rgba(192,88,32,0.5)" : "none")

const barStyle = computed(() => ({
  flex: 1,
  height: '5px',
  borderRadius: '3px',
  boxShadow: glow.value
}))
</script>

<template>
  <div 
    class="yao-line"
    :style="{
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(6px)',
      transition: `opacity 0.4s ease ${idx * 0.06}s, transform 0.4s ease ${idx * 0.06}s`
    }"
  >
    <span class="yao-pos">{{ label }}</span>
    
    <div class="yao-bar-container">
      <template v-if="info.yin">
        <div 
          :style="{
            ...barStyle,
            background: `linear-gradient(90deg, ${gold}aa, ${gold})`
          }"
        />
        <div style="width: 12px" />
        <div 
          :style="{
            ...barStyle,
            background: `linear-gradient(90deg, ${gold}, ${gold}aa)`
          }"
        />
      </template>
      
      <template v-else>
        <div 
          :style="{
            ...barStyle,
            background: `linear-gradient(90deg, ${gold}99, ${gold}, ${gold}99)`
          }"
        />
      </template>
    </div>
    
    <span 
      class="yao-name"
      :style="{ color: info.moving ? '#c05820' : '#907030' }"
    >
      {{ info.name }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.yao-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.yao-pos {
  font-size: 11px;
  color: #b09050;
  width: 28px;
  text-align: right;
  font-family: serif;
  letter-spacing: 1px;
}

.yao-bar-container {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 5px;
}

.yao-name {
  font-size: 11px;
  width: 26px;
  font-family: serif;
  letter-spacing: 1px;
}
</style>
