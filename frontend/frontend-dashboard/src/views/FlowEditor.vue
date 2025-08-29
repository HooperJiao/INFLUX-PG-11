<template>
  <div class="editor-container">
    <div class="left-panel">
      <ShapePanel />
    </div>
    <div class="right-panel">
      <div class="canvas-area">
        <FlowCanvas />
      </div>
      <div class="grafana-area">
        <iframe
          src="http://localhost:3000/d/f1dae5a5-46df-462a-b290-0b8ed32b2d52/temperature-dashboard?orgId=1&from=now-6h&to=now&timezone=browser"
          width="100%"
          height="100%"
          frameborder="0"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import ShapePanel from "@/components/ShapePanel.vue";
import FlowCanvas from "@/components/FlowCanvas.vue";
</script>

<style scoped>
.editor-container {
  display: flex;
  height: 100vh;
}

.left-panel {
  width: 120px;
  background-color: #f5f5f5;
  border-right: 1px solid #ccc;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.canvas-area {
  flex: 2;
  background-color: #fff;
}

.grafana-area {
  flex: 1;
  border-top: 1px solid #ccc;
}
</style>
