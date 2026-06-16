<template>
  <div class="annotation-toolbar">
    <!-- Marker Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'marker' }"
      :title="t('overlay.drawTools.marker') + ' (1)'"
      @click="toggleTool('marker')"
    >
      <i class="mdi mdi-numeric-1-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.marker') }}</span>
    </button>

    <!-- Rectangle Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'rect' }"
      :title="t('overlay.drawTools.rect') + ' (2)'"
      @click="toggleTool('rect')"
    >
      <i class="mdi mdi-numeric-2-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.rect') }}</span>
    </button>

    <!-- Arrow Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'arrow' }"
      :title="t('overlay.drawTools.arrow') + ' (3)'"
      @click="toggleTool('arrow')"
    >
      <i class="mdi mdi-numeric-3-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.arrow') }}</span>
    </button>

    <!-- Text Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'text' }"
      :title="t('overlay.drawTools.text') + ' (4)'"
      @click="toggleTool('text')"
    >
      <i class="mdi mdi-numeric-4-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.text') }}</span>
    </button>

    <!-- Blur Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'blur' }"
      :title="t('overlay.drawTools.blur') + ' (5)'"
      @click="toggleTool('blur')"
    >
      <i class="mdi mdi-numeric-5-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.blur') }}</span>
    </button>

    <!-- Freehand Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'freedraw' }"
      :title="t('overlay.drawTools.freedraw') + ' (6)'"
      @click="toggleTool('freedraw')"
    >
      <i class="mdi mdi-numeric-6-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.freedraw') }}</span>
    </button>

    <!-- Highlight Tool -->
    <button
      type="button"
      class="toolbar-btn"
      :class="{ active: activeTool === 'highlight' }"
      :title="t('overlay.drawTools.highlight') + ' (7)'"
      @click="toggleTool('highlight')"
    >
      <i class="mdi mdi-numeric-7-circle-outline"></i>
      <span class="btn-label">{{ t('overlay.drawTools.highlight') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useI18n } from '@/composables/useI18n'

const overlayStore = useOverlayStore()
const activeTool = computed(() => overlayStore.activeTool)
const { t } = useI18n()

const toggleTool = (tool: 'marker' | 'rect' | 'arrow' | 'text' | 'blur' | 'freedraw' | 'highlight') => {
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
