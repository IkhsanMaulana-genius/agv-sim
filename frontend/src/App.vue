<template>
  <Simulator />
</template>

<script setup>
import Simulator from "./views/Simulator.vue";
</script>

<style lang="postcss">
@import "./tailwind.css";

body {
  @apply bg-gray-200 flex justify-center items-center h-auto py-5;
}
</style>
