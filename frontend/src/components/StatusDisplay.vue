<template>
  <div class="json-container">
    <div class="flex justify-between border-b-2 border-gray-300 pb-3">
      <button class="btn">Status</button>
    </div>
    <div class="pt-2">
      <h2 class="text-lg font-bold pb-3">Current Status</h2>
      <div class="status-info">
        <p>Position: ({{ currentPosition }})</p>
        <p>State: {{ operatingMode }}</p>
        <p>Battery: {{ batteryLevel }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useMqttStore } from "../store/mqttStore";

const mqttStore = useMqttStore();

const currentPosition = computed(() => {
  const pos = mqttStore.lastReceivedState?.position;
  if (!pos) return "Unknown";

  const fixedX = parseFloat(pos.x.toFixed(3));
  const fixedY = parseFloat(pos.y.toFixed(3));

  return `${fixedX}, ${fixedY}`;
});

const operatingMode = computed(
  () => mqttStore.lastReceivedState?.operatingMode || "Unknown"
);

const batteryLevel = computed(() => {
  const level = mqttStore.lastReceivedState?.batteryState?.batteryCharge ?? 0;
  const clampedLevel = Math.min(100, Math.max(0, level)); // Ensure range 0-100%
  return parseFloat(clampedLevel.toFixed(3)); // Round to two decimal places
});
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
