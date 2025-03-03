<template>
  <button @click="moveToNext" class="btn">Transport Order</button>
</template>

<script setup>
import { useMqttStore } from "../store/mqttStore";

const mqttStore = useMqttStore();

const moveToNext = () => {
  const order = {
    orderId: `ORDER-${Date.now()}`,
    headerId: 1,
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    manufacturer: "AGVSimulator",
    serialNumber: "AGV001",
    orderUpdateId: 1,
    nodes: [
      { nodeId: "N1", x: 30, y: 20 },
      { nodeId: "N2", x: 60, y: 20 },
    ],
  };

  mqttStore.orderDisplay = order;
  mqttStore.publishAction("ORDER", order);
};
</script>

<style scoped lang="postcss">
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition;
  width: 200px;
}
</style>
