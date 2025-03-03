<template>
  <div class="json-container">
    <div class="flex justify-between border-b-2 border-gray-300 pb-3">
      <button class="btn" @click="OrderDisplay">Order</button>
      <button class="btn" @click="PauseDisplay">Pause</button>
    </div>
    <div class="pt-2">
      <h2 class="text-lg font-bold pb-3">{{ displayTitle }}</h2>
      <pre>{{ formattedDisplay }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMqttStore } from "../store/mqttStore";

const mqttStore = useMqttStore();

const display = ref();
const displayTitle = ref("Action Display");

const formattedDisplay = computed(() => {
  return JSON.stringify(display.value, null, 2);
});

const OrderDisplay = () => {
  displayTitle.value = "Order Details";
  display.value = mqttStore.orderDisplay;
};

const PauseDisplay = () => {
  displayTitle.value = "Pause Action";
  display.value = mqttStore.pauseDisplay;
};
</script>

<style scoped lang="postcss">
.json-container {
  @apply mt-4 p-4 bg-gray-100 rounded-md shadow;
  height: 50vh;
  width: 300px;
  overflow: auto;
}

.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition;
  width: 120px;
}
</style>
