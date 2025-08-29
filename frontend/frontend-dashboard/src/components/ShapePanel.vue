<template>
  <div class="shape-panel">
    <div
      class="shape-item rectangle"
      draggable="true"
      @dragstart="startDrag('rectangle')"
    ></div>
    <div
      class="shape-item circle"
      draggable="true"
      @dragstart="startDrag('circle')"
    ></div>
    <div
      class="shape-item arrow"
      draggable="true"
      @dragstart="startDrag('arrow')"
    ></div>
  </div>
</template>

<script setup>
const startDrag = (shapeType) => {
  event.dataTransfer.setData("shape", shapeType);
};
</script>

<style scoped>
.shape-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
  background-color: #f0f0f0;
}

.shape-item {
  width: 50px;
  height: 50px;
  cursor: grab;
  border: 2px solid #666;
  background-color: white;
}

.rectangle {
  background-color: #ffd700;
}

.circle {
  border-radius: 50%;
  background-color: #00bfff;
}

.arrow {
  clip-path: polygon(0 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0 70%);
  background-color: #32cd32;
}
</style>
