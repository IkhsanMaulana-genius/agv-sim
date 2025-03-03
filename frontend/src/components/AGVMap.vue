<template>
  <div>
    <div class="map">
      <!-- Path Lines -->
      <svg class="absolute w-full h-full">
        <line
          x1="70"
          y1="90"
          x2="180"
          y2="90"
          stroke="black"
          stroke-width="3"
        />
        <line
          x1="200"
          y1="90"
          x2="350"
          y2="90"
          stroke="black"
          stroke-width="3"
        />
      </svg>

      <!-- Static Nodes -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="node"
        :style="getNodeStyle(node)"
      >
        {{ node.label }}
      </div>

      <!-- Position Labels -->
      <div
        v-for="position in positions"
        :key="position.id"
        class="node-position"
        :style="getNodeStyle(position)"
      >
        {{ position.label }}
      </div>

      <!-- AGV Vehicle -->
      <div class="agv" :style="agvStyle">🛵</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useMqttStore } from "../store/mqttStore";

const mqttStore = useMqttStore();

// Map Configuration
const nodes = [
  { id: "A", x: 30, y: 70, label: "A" },
  { id: "B", x: 180, y: 70, label: "B" },
  { id: "C", x: 330, y: 70, label: "C" },
];

const positions = [
  { id: "A", x: 30, y: 120, label: "(0, 20)" },
  { id: "B", x: 180, y: 120, label: "(30, 20)" },
  { id: "C", x: 330, y: 120, label: "(60, 20)" },
];

// AGV Position Tracking
const agvPosition = ref({ x: 30, y: 70 });

// Position Calculations
const calculateAGVPosition = (newPos) => {
  if (!newPos) return agvPosition.value;

  if (newPos.x >= 60) {
    return { x: nodes[2].x, y: nodes[0].y };
  }

  const progress = newPos.x / 60;
  return {
    x: nodes[0].x + (nodes[2].x - nodes[0].x) * progress,
    y: nodes[0].y,
  };
};

// Reactive Styles
const agvStyle = computed(() => {
  const position = calculateAGVPosition(mqttStore.lastReceivedState?.position);
  return {
    left: `${position.x}px`,
    top: "70px",
    transition: "all 0.5s linear",
  };
});

const getNodeStyle = (node) => ({
  left: `${node.x}px`,
  top: `${node.y}px`,
});
</script>

<style scoped lang="postcss">
.map {
  @apply relative bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center;
  width: 400px;
  height: 200px;
}

.node {
  @apply absolute w-10 h-10 bg-blue-500 text-white font-bold flex items-center justify-center rounded-full;
}

.node-position {
  @apply absolute;
}

.agv {
  @apply absolute text-2xl transition-all duration-700 ease-in-out px-1;
}
</style>
