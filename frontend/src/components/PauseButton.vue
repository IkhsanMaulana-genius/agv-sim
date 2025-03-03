<template>
  <button
    @click="togglePause"
    class="btn"
    :class="
      isPaused
        ? 'bg-green-500 hover:bg-green-600'
        : 'bg-red-500 hover:bg-red-600'
    "
  >
    {{ isPaused ? "Resume" : "Pause" }}
  </button>
</template>

<script setup>
import { ref } from "vue";
import { useMqttStore } from "../store/mqttStore";

const mqttStore = useMqttStore();
const isPaused = ref(false);

const togglePause = () => {
  isPaused.value = !isPaused.value;
  const action = {
    headerId: 1,
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    manufacturer: "AGVSimulator",
    serialNumber: "AGV001",
    actionId: `ACTION-${Date.now()}`,
    actionType: isPaused.value ? "PAUSE" : "RESUME",
  };

  mqttStore.pauseDisplay = action;
  mqttStore.publishAction("INSTANT_ACTIONS", action);
};
</script>

<style scoped lang="postcss">
.btn {
  @apply px-4 py-2 text-white rounded-lg shadow-md transition;
  width: 200px;
}
</style>
