<script setup lang="ts">
const baseUrl = import.meta.env.BASE_URL

defineProps<{
  yang: boolean
}>()
</script>

<template>
  <img v-if="yang" :src="`${baseUrl}images/divination/coin_head.webp`" class="coin-img" alt="" />
  <img v-else :src="`${baseUrl}images/divination/coin_tail.webp`" class="coin-img" alt="" />
</template>

<style scoped>
.coin-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.4));
}
</style>
