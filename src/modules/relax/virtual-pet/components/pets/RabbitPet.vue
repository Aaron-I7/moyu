<template>
  <svg
    viewBox="0 0 160 192"
    width="160"
    height="192"
    xmlns="http://www.w3.org/2000/svg"
    :class="['pet-svg', state, randomAction]"
    style="image-rendering: pixelated; overflow: visible"
    role="img"
    :aria-label="`rabbit — ${state}`"
  >
    <g class="ears" :class="earClass">
      <rect x="24" y="0" width="16" height="64" :fill="color" />
      <rect x="28" y="8" width="8" height="48" fill="#fecdd3" />
      <rect x="120" y="0" width="16" height="64" :fill="color" />
      <rect x="124" y="8" width="8" height="48" fill="#fecdd3" />
    </g>

    <rect x="32" y="56" width="96" height="8" :fill="color" />
    <rect x="24" y="64" width="112" height="48" :fill="color" />
    <rect x="32" y="112" width="96" height="8" :fill="color" />

    <rect x="40" y="72" width="80" height="40" fill="#fef3c7" />
    <rect x="40" y="110" width="80" height="2" fill="#f0e4a8" />

    <rect x="32" y="120" width="24" height="24" :fill="color" />
    <rect x="104" y="120" width="24" height="24" :fill="color" />
    <rect x="40" y="136" width="8" height="8" :fill="accentColor" />
    <rect x="112" y="136" width="8" height="8" :fill="accentColor" />

    <circle cx="56" cy="144" r="8" fill="#fecdd3" />
    <circle cx="104" cy="144" r="8" fill="#fecdd3" />

    <g class="tail" :class="tailClass">
      <ellipse cx="80" cy="160" rx="16" ry="8" :fill="color" />
    </g>

    <g v-if="eyeState === 'normal'">
      <circle cx="52" cy="80" r="8" fill="#1e293b" />
      <circle cx="50" cy="78" r="3" fill="#ffffff" />
      <circle cx="108" cy="80" r="8" fill="#1e293b" />
      <circle cx="106" cy="78" r="3" fill="#ffffff" />
    </g>
    <g v-else-if="eyeState === 'happy'">
      <path d="M44 80 Q52 72 60 80" stroke="#1e293b" stroke-width="4" fill="none" />
      <path d="M100 80 Q108 72 116 80" stroke="#1e293b" stroke-width="4" fill="none" />
    </g>
    <g v-else-if="eyeState === 'sleeping'">
      <rect x="44" y="78" width="16" height="4" fill="#1e293b" />
      <rect x="100" y="78" width="16" height="4" fill="#1e293b" />
    </g>
    <g v-else-if="eyeState === 'tired'">
      <rect x="44" y="80" width="16" height="4" fill="#1e293b" />
      <rect x="100" y="80" width="16" height="4" fill="#1e293b" />
    </g>

    <g v-if="mouthState === 'neutral'">
      <rect x="72" y="96" width="16" height="4" fill="#1e293b" />
    </g>
    <g v-else-if="mouthState === 'smile'">
      <rect x="64" y="96" width="4" height="4" fill="#1e293b" />
      <rect x="92" y="96" width="4" height="4" fill="#1e293b" />
      <rect x="68" y="100" width="24" height="4" fill="#1e293b" />
    </g>
    <g v-else-if="mouthState === 'frown'">
      <rect x="68" y="96" width="24" height="4" fill="#1e293b" />
      <rect x="64" y="100" width="4" height="4" fill="#1e293b" />
      <rect x="92" y="100" width="4" height="4" fill="#1e293b" />
    </g>
    <g v-else-if="mouthState === 'open'">
      <rect x="64" y="96" width="4" height="4" fill="#1e293b" />
      <rect x="92" y="96" width="4" height="4" fill="#1e293b" />
      <rect x="68" y="100" width="24" height="8" fill="#1e293b" />
      <rect x="72" y="104" width="16" height="4" fill="#ec4899" />
    </g>

    <rect x="76" y="88" width="8" height="8" fill="#fecdd3" />
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

const earClass = computed(() => {
  if (props.randomAction === 'wiggle') return 'ears-perked'
  if (props.state === 'special') return 'ears-perked'
  if (['happy', 'playing'].includes(props.state)) return 'ears-perked'
  if (props.state === 'tired') return 'ears-droopy'
  return 'ears-normal'
})

const tailClass = computed(() => {
  if (props.randomAction === 'wiggle') return 'tail-wiggle'
  if (props.state === 'special') return 'tail-wiggle'
  if (['sleeping'].includes(props.state)) return 'tail-still'
  if (['happy', 'playing'].includes(props.state)) return 'tail-wiggle'
  return 'tail-normal'
})
</script>

<style scoped lang="scss">
.pet-svg {
  transform-origin: 80px 192px;
}

.pet-svg.idle { animation: breathe 3s ease-in-out infinite; }
.pet-svg.happy { animation: bounce 0.55s ease-in-out infinite; }
.pet-svg.hungry { animation: sway 2s ease-in-out infinite; }
.pet-svg.tired { animation: droop 4s ease-in-out infinite; }
.pet-svg.sleeping { animation: breatheSlow 4s ease-in-out infinite; }
.pet-svg.playing { animation: hop 0.4s ease-out infinite alternate; }
.pet-svg.eating { animation: nibble 0.3s ease-in-out infinite; }
.pet-svg.bathing { animation: shake 0.3s ease-in-out infinite; }
.pet-svg.special { animation: hop 0.35s ease-out infinite alternate; }

.pet-svg.sway-left { animation: swayLeft 1.5s ease-in-out; }
.pet-svg.sway-right { animation: swayRight 1.5s ease-in-out; }
.pet-svg.stretch { animation: stretch 1.5s ease-in-out; }
.pet-svg.yawn { animation: yawn 1.5s ease-in-out; }
.pet-svg.look-around { animation: lookAround 1.5s ease-in-out; }
.pet-svg.wiggle { animation: wiggle 1s ease-in-out; }

.ears { transform-origin: 80px 64px; }
.ears.ears-perked { animation: earsPerk 0.5s ease-out; }
.ears.ears-droopy { transform: rotate(10deg); }

.tail { transform-origin: 80px 160px; }
.tail.tail-normal { animation: tailTwitch 3s ease-in-out infinite; }
.tail.tail-wiggle { animation: tailWiggle 0.3s ease-in-out infinite; }
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
@keyframes hop {
  from { transform: translateY(0) rotate(0); }
  to { transform: translateY(-25px) rotate(5deg); }
}
@keyframes nibble {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
@keyframes tailTwitch {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(5deg); }
}
@keyframes tailWiggle {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}
@keyframes earsPerk {
  0% { transform: rotate(0); }
  50% { transform: rotate(-5deg); }
  100% { transform: rotate(0); }
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
