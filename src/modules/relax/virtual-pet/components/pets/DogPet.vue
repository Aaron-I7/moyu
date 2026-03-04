<template>
  <svg
    viewBox="0 0 192 192"
    width="192"
    height="192"
    xmlns="http://www.w3.org/2000/svg"
    :class="['pet-svg', state, randomAction]"
    style="image-rendering: pixelated; overflow: visible"
    role="img"
    :aria-label="`dog — ${state}`"
  >
    <g class="tail" :class="tailClass">
      <rect x="160" y="80" width="8" height="40" :fill="color" />
      <rect x="168" y="64" width="8" height="32" :fill="color" />
      <rect x="176" y="56" width="8" height="16" :fill="color" />
      <rect x="168" y="72" width="8" height="16" :fill="accentColor" />
    </g>

    <rect x="32" y="88" width="128" height="8" :fill="color" />
    <rect x="32" y="96" width="128" height="40" :fill="color" />
    <rect x="40" y="136" width="112" height="8" :fill="color" />
    <rect x="48" y="104" width="96" height="32" fill="#fef3c7" />
    <rect x="48" y="134" width="96" height="2" fill="#f0e4a8" />
    <rect x="32" y="144" width="32" height="16" :fill="color" />
    <rect x="128" y="144" width="32" height="16" :fill="color" />
    <rect x="40" y="152" width="8" height="8" :fill="accentColor" />
    <rect x="144" y="152" width="8" height="8" :fill="accentColor" />

    <rect x="32" y="16" width="128" height="8" :fill="color" />
    <rect x="24" y="24" width="144" height="56" :fill="color" />
    <rect x="32" y="80" width="128" height="8" :fill="color" />

    <rect x="8" y="8" width="24" height="8" :fill="color" />
    <rect x="8" y="16" width="16" height="8" :fill="color" />
    <rect x="8" y="8" width="16" height="8" fill="#fcd34d" />
    <rect x="160" y="8" width="24" height="8" :fill="color" />
    <rect x="168" y="16" width="16" height="8" :fill="color" />
    <rect x="168" y="8" width="16" height="8" fill="#fcd34d" />

    <rect x="24" y="56" width="24" height="16" :fill="accentColor" />
    <rect x="144" y="56" width="24" height="16" :fill="accentColor" />

    <rect x="80" y="64" width="32" height="8" fill="#1e293b" />
    <rect x="88" y="72" width="16" height="8" fill="#1e293b" />

    <g v-if="eyeState === 'normal'">
      <rect x="40" y="40" width="20" height="20" fill="#1e293b" />
      <rect x="40" y="40" width="10" height="10" fill="#ffffff" />
      <rect x="132" y="40" width="20" height="20" fill="#1e293b" />
      <rect x="132" y="40" width="10" height="10" fill="#ffffff" />
    </g>
    <g v-else-if="eyeState === 'happy'">
      <rect x="40" y="32" width="20" height="28" fill="#1e293b" />
      <rect x="40" y="32" width="10" height="10" fill="#ffffff" />
      <rect x="132" y="32" width="20" height="28" fill="#1e293b" />
      <rect x="132" y="32" width="10" height="10" fill="#ffffff" />
    </g>
    <g v-else-if="eyeState === 'sleeping'">
      <rect x="36" y="48" width="28" height="8" fill="#1e293b" />
      <rect x="128" y="48" width="28" height="8" fill="#1e293b" />
    </g>
    <g v-else-if="eyeState === 'tired'">
      <rect x="40" y="48" width="20" height="8" fill="#1e293b" />
      <rect x="132" y="48" width="20" height="8" fill="#1e293b" />
    </g>

    <g v-if="mouthState === 'neutral'">
      <rect x="84" y="88" width="24" height="8" fill="#1e293b" />
      <rect x="88" y="96" width="16" height="8" fill="#f87171" />
    </g>
    <g v-else-if="mouthState === 'smile'">
      <rect x="64" y="88" width="8" height="8" fill="#1e293b" />
      <rect x="120" y="88" width="8" height="8" fill="#1e293b" />
      <rect x="72" y="96" width="48" height="8" fill="#1e293b" />
      <rect x="80" y="104" width="32" height="8" fill="#f87171" />
    </g>
    <g v-else-if="mouthState === 'frown'">
      <rect x="72" y="88" width="48" height="8" fill="#1e293b" />
      <rect x="64" y="96" width="8" height="8" fill="#1e293b" />
      <rect x="120" y="96" width="8" height="8" fill="#1e293b" />
    </g>
    <g v-else-if="mouthState === 'open'">
      <rect x="64" y="88" width="8" height="8" fill="#1e293b" />
      <rect x="120" y="88" width="8" height="8" fill="#1e293b" />
      <rect x="72" y="96" width="48" height="8" fill="#1e293b" />
      <rect x="80" y="104" width="32" height="8" fill="#ec4899" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  state: string
  color: string
  accentColor: string
  randomAction?: string
}>()

const eyeState = computed(() => {
  if (props.randomAction === 'yawn') return 'sleeping'
  if (props.state === 'special') return 'happy'
  return {
    sleeping: 'sleeping',
    happy: 'happy',
    playing: 'happy',
    hungry: 'normal',
    tired: 'tired',
  }[props.state] ?? 'normal'
})

const mouthState = computed(() => {
  if (props.randomAction === 'yawn') return 'open'
  if (props.state === 'special') return 'smile'
  if (['happy', 'playing'].includes(props.state)) return 'smile'
  if (props.state === 'eating') return 'open'
  if (props.state === 'hungry') return 'frown'
  return 'neutral'
})

const tailClass = computed(() => {
  if (props.randomAction === 'wiggle') return 'tail-fast'
  if (props.state === 'special') return 'tail-fast'
  if (['sleeping'].includes(props.state)) return 'tail-still'
  if (['happy', 'playing'].includes(props.state)) return 'tail-fast'
  return 'tail-wag'
})
</script>

<style scoped lang="scss">
.pet-svg {
  transform-origin: 96px 192px;
}

.pet-svg.idle { animation: breathe 3s ease-in-out infinite; }
.pet-svg.happy { animation: bounce 0.55s ease-in-out infinite; }
.pet-svg.hungry { animation: sway 2s ease-in-out infinite; }
.pet-svg.tired { animation: droop 4s ease-in-out infinite; }
.pet-svg.sleeping { animation: breatheSlow 4s ease-in-out infinite; }
.pet-svg.playing { animation: jump 0.45s ease-out infinite alternate; }
.pet-svg.eating { animation: nod 0.45s ease-in-out infinite; }
.pet-svg.bathing { animation: shake 0.3s ease-in-out infinite; }
.pet-svg.special { animation: bounce 0.4s ease-in-out infinite; }

.pet-svg.sway-left { animation: swayLeft 1.5s ease-in-out; }
.pet-svg.sway-right { animation: swayRight 1.5s ease-in-out; }
.pet-svg.stretch { animation: stretch 1.5s ease-in-out; }
.pet-svg.yawn { animation: yawn 1.5s ease-in-out; }
.pet-svg.look-around { animation: lookAround 1.5s ease-in-out; }
.pet-svg.wiggle { animation: wiggle 1s ease-in-out; }

.tail {
  transform-origin: 160px 120px;
}
.tail.tail-wag { animation: tailWag 1.5s ease-in-out infinite; }
.tail.tail-fast { animation: tailWag 0.35s ease-in-out infinite; }
.tail.tail-still { animation: none; }

@keyframes breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.03); }
}
@keyframes breatheSlow {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.02); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes sway {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
@keyframes droop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}
@keyframes jump {
  from { transform: translateY(0) rotate(0); }
  to { transform: translateY(-20px) rotate(-6deg); }
}
@keyframes nod {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(-8deg); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
@keyframes tailWag {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(30deg); }
}
@keyframes swayLeft {
  0%, 100% { transform: rotate(0); }
  30% { transform: rotate(-10deg); }
  60% { transform: rotate(-5deg); }
}
@keyframes swayRight {
  0%, 100% { transform: rotate(0); }
  30% { transform: rotate(10deg); }
  60% { transform: rotate(5deg); }
}
@keyframes stretch {
  0%, 100% { transform: scaleY(1); }
  30% { transform: scaleY(1.1); }
  50% { transform: scaleY(1.05) translateY(-8px); }
}
@keyframes yawn {
  0%, 100% { transform: scale(1); }
  30% { transform: scaleY(1.05) scaleX(0.98); }
  60% { transform: scaleY(1.02); }
}
@keyframes lookAround {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
}
@keyframes wiggle {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}
</style>
