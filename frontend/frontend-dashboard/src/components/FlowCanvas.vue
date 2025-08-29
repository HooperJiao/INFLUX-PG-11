<template>
  <div class="canvas" @drop="onDrop" @dragover.prevent>
    <svg width="100%" height="100%">
      <template v-for="(shape, index) in shapes" :key="index">
        <rect
          v-if="shape.type === 'rectangle'"
          :x="shape.x"
          :y="shape.y"
          width="80"
          height="50"
          fill="#ffd700"
        />
        <circle
          v-else-if="shape.type === 'circle'"
          :cx="shape.x + 25"
          :cy="shape.y + 25"
          r="25"
          fill="#00bfff"
        />
        <polygon
          v-else-if="shape.type === 'arrow'"
          :points="getArrowPoints(shape.x, shape.y)"
          fill="#32cd32"
        />
      </template>
    </svg>
  </div>
</template>

<script setup>
import { ref } from "vue";

const shapes = ref([]);

const onDrop = (event) => {
  const type = event.dataTransfer.getData("shape");
  const rect = event.target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  shapes.value.push({ type, x, y });
};

const getArrowPoints = (x, y) => {
  return `${x},${y + 15} ${x + 50},${y + 15} ${x + 50},${y} ${x + 80},${
    y + 40
  } ${x + 50},${y + 80} ${x + 50},${y + 65} ${x},${y + 65}`;
};
</script>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #ccc;
}
</style>
