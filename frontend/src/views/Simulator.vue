<template>
  <div class="container">
    <h1 class="text-4xl font-bold text-gray-800">VDA5050 Simulator</h1>
    <div class="status-indicator">
      <span>Connection Status: </span>
      <span
        :class="[
          'status',
          mqttStore.connectionStatus === 'Connected'
            ? 'connected'
            : 'disconnected',
        ]"
        >{{ mqttStore.connectionStatus }}</span
      >
    </div>
    <div class="flex flex-col space-y-10">
      <div class="flex space-x-10 items-center justify-center">
        <div class="button-container">
          <TransportOrder />
          <PauseButton />
        </div>
        <div>
          <AGVMap />
        </div>
      </div>

      <div class="flex space-x-10 items-center justify-between">
        <ActionDisplay />
        <StatusDisplay />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useMqttStore } from "../store/mqttStore";
import TransportOrder from "../components/TransportOrder.vue";
import PauseButton from "../components/PauseButton.vue";
import AGVMap from "../components/AGVMap.vue";
import ActionDisplay from "../components/ActionDisplay.vue";
import StatusDisplay from "../components/StatusDisplay.vue";

const mqttStore = useMqttStore();

onMounted(() => {
  mqttStore.connectMqtt();
  // mqttStore.subscribeAction("STATE");
});

onUnmounted(() => {
  mqttStore.disconnectMqtt();
});
</script>

<style scoped lang="postcss">
.container {
  @apply flex flex-col items-center space-y-10 p-6 bg-white shadow-lg rounded-lg py-12;
  width: 70vw;
}

.button-container {
  @apply flex flex-col space-y-4 border border-gray-200 rounded-lg p-4;
}

.status-indicator {
  @apply flex items-center justify-center space-x-2 text-center;
}
.status {
  @apply px-3 py-1 rounded text-white;
}

.status.connected {
  @apply bg-green-600;
}

.status.disconnected {
  @apply bg-red-600;
}
</style>
