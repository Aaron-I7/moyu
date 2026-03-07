<script setup lang="ts">
defineProps<{
  yang: boolean
}>()
</script>

<template>
  <img v-if="yang" src="/images/divination/coin_head.webp" class="coin-img" alt="Yang" />
  <img v-else src="/images/divination/coin_tail.webp" class="coin-img" alt="Yin" />
</template>

<style scoped>
.coin-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Add a subtle drop shadow for depth */
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.4));
}
</style>
