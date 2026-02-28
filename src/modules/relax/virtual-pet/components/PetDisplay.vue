<template>
  <div class="pet-container" :class="[state, randomAction]" @click="$emit('tap')">
    <div class="effects-layer">
      <template v-if="state === 'sleeping'">
        <span class="zzz z1" aria-hidden="true">z</span>
        <span class="zzz z2" aria-hidden="true">Z</span>
        <span class="zzz z3" aria-hidden="true">Z</span>
      </template>

      <template v-if="state === 'eating'">
        <div class="food-bowl">
          <svg viewBox="0 0 64 32" width="64" height="32">
            <rect x="0" y="16" width="64" height="16" fill="#78716c" />
            <rect x="4" y="8" width="56" height="12" fill="#a8a29e" />
            <rect x="8" y="12" width="12" height="8" fill="#fbbf24" />
            <rect x="24" y="10" width="8" height="10" fill="#f97316" />
            <rect x="36" y="12" width="10" height="8" fill="#84cc16" />
            <rect x="50" y="10" width="6" height="10" fill="#fbbf24" />
          </svg>
        </div>
      </template>

      <template v-if="state === 'playing'">
        <div class="toy-ball">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="#ec4899" />
            <path d="M8 8 Q16 16 8 24" stroke="#f472b6" stroke-width="3" fill="none" />
            <path d="M24 8 Q16 16 24 24" stroke="#f472b6" stroke-width="3" fill="none" />
            <circle cx="10" cy="10" r="3" fill="#fce7f3" opacity="0.6" />
          </svg>
        </div>
      </template>

      <template v-if="state === 'bathing'">
        <div class="water-drops">
          <span class="drop d1">💧</span>
          <span class="drop d2">💧</span>
          <span class="drop d3">💧</span>
          <span class="drop d4">💧</span>
          <span class="drop d5">💧</span>
        </div>
        <div class="bubbles">
          <span class="bubble b1">○</span>
          <span class="bubble b2">○</span>
          <span class="bubble b3">○</span>
        </div>
      </template>

      <template v-if="state === 'special'">
        <div class="special-effect">
          <span class="sparkle s1">✨</span>
          <span class="sparkle s2">⭐</span>
          <span class="sparkle s3">✨</span>
          <span class="sparkle s4">💫</span>
        </div>
      </template>
    </div>

    <div class="pet-wrapper">
      <CatPet v-if="petType === 'cat'" :state="state" :color="color" :accent-color="accentColor" :random-action="randomAction" />
      <DogPet v-else-if="petType === 'dog'" :state="state" :color="color" :accent-color="accentColor" :random-action="randomAction" />
      <RabbitPet v-else-if="petType === 'rabbit'" :state="state" :color="color" :accent-color="accentColor" :random-action="randomAction" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { PetType } from '../stores/pet'
import CatPet from './pets/CatPet.vue'
import DogPet from './pets/DogPet.vue'
import RabbitPet from './pets/RabbitPet.vue'

const props = defineProps<{
  petType: PetType
  state: string
  color: string
  accentColor: string
}>()

defineEmits(['tap'])

const randomAction = ref('')
let actionTimer: ReturnType<typeof setTimeout> | null = null

const randomActions = [
  'sway-left',
  'sway-right', 
  'stretch',
  'yawn',
  'look-around',
  'wiggle',
]

function triggerRandomAction() {
  if (props.state !== 'idle' && props.state !== 'happy') {
    return
  }
  
  const action = randomActions[Math.floor(Math.random() * randomActions.length)]!
  randomAction.value = action
  
  setTimeout(() => {
    randomAction.value = ''
  }, 1500)
  
  scheduleNextAction()
}

function scheduleNextAction() {
  if (actionTimer) {
    clearTimeout(actionTimer)
  }
  
  const delay = 3000 + Math.random() * 5000
  actionTimer = setTimeout(triggerRandomAction, delay)
}

watch(() => props.state, (newState) => {
  if (newState === 'idle' || newState === 'happy') {
    scheduleNextAction()
  } else {
    if (actionTimer) {
      clearTimeout(actionTimer)
      actionTimer = null
    }
    randomAction.value = ''
  }
})

onMounted(() => {
  if (props.state === 'idle' || props.state === 'happy') {
    scheduleNextAction()
  }
})

onUnmounted(() => {
  if (actionTimer) {
    clearTimeout(actionTimer)
  }
})
</script>

<style scoped lang="scss">
.pet-container {
  position: relative;
  width: 200px;
  height: 220px;
  margin: 0 auto;
  cursor: pointer;
  user-select: none;
}

.pet-wrapper {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.effects-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.zzz {
  position: absolute;
  color: #06b6d4;
  text-shadow: 1px 1px 0 #000;
  animation: floatUp 2s ease-in infinite;
  line-height: 1;
}
.z1 { left: 20px; top: 20px; font-size: 10px; animation-delay: 0s; }
.z2 { left: 36px; top: 10px; font-size: 14px; animation-delay: 0.7s; }
.z3 { left: 54px; top: 4px; font-size: 18px; animation-delay: 1.4s; }

.food-bowl {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  animation: bounce 0.6s ease-in-out infinite;
}

.toy-ball {
  position: absolute;
  top: 20px;
  right: 10px;
  animation: ballBounce 0.8s ease-in-out infinite;
}

.water-drops {
  position: absolute;
  inset: 0;
}

.drop {
  position: absolute;
  font-size: 16px;
  animation: dropFall 1.5s ease-in infinite;
}
.d1 { left: 20%; top: 0; animation-delay: 0s; }
.d2 { left: 40%; top: -10px; animation-delay: 0.3s; }
.d3 { left: 60%; top: 0; animation-delay: 0.6s; }
.d4 { left: 30%; top: -20px; animation-delay: 0.9s; }
.d5 { left: 70%; top: -10px; animation-delay: 1.2s; }

.bubbles {
  position: absolute;
  inset: 0;
}

.bubble {
  position: absolute;
  color: #93c5fd;
  font-size: 12px;
  animation: bubbleFloat 2s ease-out infinite;
}
.b1 { left: 25%; bottom: 30%; animation-delay: 0s; }
.b2 { left: 65%; bottom: 40%; animation-delay: 0.5s; }
.b3 { left: 45%; bottom: 25%; animation-delay: 1s; }

.special-effect {
  position: absolute;
  inset: 0;
}

.sparkle {
  position: absolute;
  font-size: 20px;
  animation: sparkleFloat 1.5s ease-out infinite;
}
.s1 { left: 15%; top: 10%; animation-delay: 0s; }
.s2 { left: 75%; top: 20%; animation-delay: 0.3s; }
.s3 { left: 25%; top: 50%; animation-delay: 0.6s; }
.s4 { left: 70%; top: 60%; animation-delay: 0.9s; }

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-40px); }
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}

@keyframes ballBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

@keyframes dropFall {
  0% { opacity: 0; transform: translateY(-20px); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translateY(180px); }
}

@keyframes bubbleFloat {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
}

@keyframes sparkleFloat {
  0% { opacity: 0; transform: translateY(0) scale(0.5) rotate(0deg); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-40px) scale(1.3) rotate(180deg); }
}

.pet-container.sway-left .pet-wrapper {
  animation: swayLeftAction 1.5s ease-in-out;
}

.pet-container.sway-right .pet-wrapper {
  animation: swayRightAction 1.5s ease-in-out;
}

.pet-container.stretch .pet-wrapper {
  animation: stretchAction 1.5s ease-in-out;
}

.pet-container.yawn .pet-wrapper {
  animation: yawnAction 1.5s ease-in-out;
}

.pet-container.look-around .pet-wrapper {
  animation: lookAroundAction 1.5s ease-in-out;
}

.pet-container.wiggle .pet-wrapper {
  animation: wiggleAction 1s ease-in-out;
}

@keyframes swayLeftAction {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  25% { transform: translateX(-50%) rotate(-8deg); }
  50% { transform: translateX(-50%) rotate(-12deg); }
  75% { transform: translateX(-50%) rotate(-5deg); }
}

@keyframes swayRightAction {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  25% { transform: translateX(-50%) rotate(8deg); }
  50% { transform: translateX(-50%) rotate(12deg); }
  75% { transform: translateX(-50%) rotate(5deg); }
}

@keyframes stretchAction {
  0%, 100% { transform: translateX(-50%) scaleY(1); }
  30% { transform: translateX(-50%) scaleY(1.08); }
  50% { transform: translateX(-50%) scaleY(1.05) translateY(-5px); }
  70% { transform: translateX(-50%) scaleY(1.03); }
}

@keyframes yawnAction {
  0%, 100% { transform: translateX(-50%) scale(1); }
  20% { transform: translateX(-50%) scale(1.02); }
  40% { transform: translateX(-50%) scaleY(1.05) scaleX(0.98); }
  60% { transform: translateX(-50%) scaleY(1.03) scaleX(0.99); }
}

@keyframes lookAroundAction {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  20% { transform: translateX(-50%) rotate(-5deg); }
  40% { transform: translateX(-50%) rotate(5deg); }
  60% { transform: translateX(-50%) rotate(-3deg); }
  80% { transform: translateX(-50%) rotate(3deg); }
}

@keyframes wiggleAction {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  20% { transform: translateX(-50%) translateX(-8px); }
  40% { transform: translateX(-50%) translateX(8px); }
  60% { transform: translateX(-50%) translateX(-6px); }
  80% { transform: translateX(-50%) translateX(6px); }
}
</style>
