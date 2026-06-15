<template>
  <div class="annotation-toolbar">
    <!-- Marker Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'marker' }"
      title="Marker Tool (1)"
      @click="toggleTool('marker')"
    >
      <i class="mdi mdi-numeric-1-circle-outline"></i>
      <span class="btn-label">Marker</span>
    </button>

    <!-- Rectangle Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'rect' }"
      title="Rectangle Tool (2)"
      @click="toggleTool('rect')"
    >
      <i class="mdi mdi-numeric-2-circle-outline"></i>
      <span class="btn-label">Rect</span>
    </button>

    <!-- Arrow Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'arrow' }"
      title="Arrow Tool (3)"
      @click="toggleTool('arrow')"
    >
      <i class="mdi mdi-numeric-3-circle-outline"></i>
      <span class="btn-label">Arrow</span>
    </button>

    <!-- Text Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'text' }"
      title="Text Tool (4)"
      @click="toggleTool('text')"
    >
      <i class="mdi mdi-numeric-4-circle-outline"></i>
      <span class="btn-label">Text</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'

const overlayStore = useOverlayStore()
const activeTool = computed(() => overlayStore.activeTool)

const toggleTool = (tool: 'marker' | 'rect' | 'arrow' | 'text') => {
  if (overlayStore.activeTool === tool) {
    overlayStore.setTool(null)
  } else {
    overlayStore.setTool(tool)
  }
}
</script>

<style scoped>
.annotation-toolbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000; /* Must be on top of everything except dialogs/drawers */
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(26, 29, 39, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: auto;
}

.toolbar-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
}

.toolbar-btn i {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.toolbar-btn.active {
  background: #ff6b35; /* Primary accent color */
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(255, 107, 53, 0.4);
}

.btn-label {
  user-select: none;
}
</style>
