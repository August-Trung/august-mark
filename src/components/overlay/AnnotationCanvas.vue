<template>
  <div class="canvas-container" ref="containerRef">
    <!-- Layer 1: Screenshot (Bottom) -->
    <canvas ref="screenshotCanvasRef" class="overlay-canvas z-screenshot"></canvas>

    <!-- Layer 2: Markers (Middle) -->
    <canvas ref="markerCanvasRef" class="overlay-canvas z-markers"></canvas>

    <!-- Layer 3: Drawing/Preview (Top) -->
    <canvas
      ref="drawingCanvasRef"
      class="overlay-canvas z-drawing"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    ></canvas>

    <!-- Floating Text Input box for Text Tool -->
    <div
      v-if="textInputState.visible"
      class="floating-input-wrapper"
      :style="{ left: textInputState.x + 'px', top: textInputState.y + 'px' }"
    >
      <input
        ref="textInputRef"
        v-model="textInputState.text"
        type="text"
        placeholder="Type feedback..."
        class="floating-text-input"
        @keydown.enter="commitTextInput"
        @keydown.esc="cancelTextInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCanvas } from '@/composables/useCanvas'
import { useAnnotation } from '@/composables/useAnnotation'
import { loadImage } from '@/utils/image'

const props = defineProps<{
  screenshotUrl: string
}>()

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error', message: string): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const screenshotCanvasRef = ref<HTMLCanvasElement | null>(null)
const markerCanvasRef = ref<HTMLCanvasElement | null>(null)
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const textInputRef = ref<HTMLInputElement | null>(null)

const { initCanvas, drawScreenshot } = useCanvas()

let screenshotCtx: CanvasRenderingContext2D | null = null
let markerCtx: CanvasRenderingContext2D | null = null
let drawingCtx: CanvasRenderingContext2D | null = null
let screenshotImage: HTMLImageElement | null = null

// Initialize Annotation drawing composable
const {
  textInputState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  commitTextInput,
  cancelTextInput,
  redrawCommittedCanvas
} = useAnnotation(
  markerCanvasRef,
  drawingCanvasRef,
  () => markerCtx,
  () => drawingCtx
)

const resizeCanvases = () => {
  const width = window.innerWidth
  const height = window.innerHeight

  if (screenshotCanvasRef.value && markerCanvasRef.value && drawingCanvasRef.value) {
    screenshotCtx = initCanvas(screenshotCanvasRef.value, width, height)
    markerCtx = initCanvas(markerCanvasRef.value, width, height)
    drawingCtx = initCanvas(drawingCanvasRef.value, width, height)

    // Redraw screenshot if loaded
    if (screenshotCtx && screenshotImage) {
      drawScreenshot(screenshotCtx, screenshotImage, width, height)
    }

    // Redraw committed markers/annotations
    redrawCommittedCanvas()
  }
}

const loadScreenshot = async () => {
  if (!props.screenshotUrl) return

  try {
    screenshotImage = await loadImage(props.screenshotUrl, 'anonymous')
    resizeCanvases()
    emit('load')
  } catch (err) {
    emit('error', 'Failed to load screenshot image in canvas.')
  }
}

// Watch for floating text input visibility to autofocus
watch(() => textInputState.value.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      textInputRef.value?.focus()
    })
  }
})

// Watch screenshotUrl changes
watch(() => props.screenshotUrl, () => {
  loadScreenshot()
})


onMounted(() => {
  window.addEventListener('resize', resizeCanvases)
  loadScreenshot()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvases)
})

// Expose canvas elements and contexts for use in other files
defineExpose({
  screenshotCanvasRef,
  markerCanvasRef,
  drawingCanvasRef,
  getScreenshotCtx: () => screenshotCtx,
  getMarkerCtx: () => markerCtx,
  getDrawingCtx: () => drawingCtx,
})
</script>

<style scoped>
.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: transparent;
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.z-screenshot {
  z-index: 1;
}

.z-markers {
  z-index: 2;
  pointer-events: none; /* Let clicks pass through to drawing canvas */
}

.z-drawing {
  z-index: 3;
  cursor: crosshair;
}

/* Floating Input Styling */
.floating-input-wrapper {
  position: absolute;
  z-index: 1001; /* Must render above drawing canvas */
  transform: translate(0, 0); /* Direct placement at logical coords */
}

.floating-text-input {
  background: rgba(15, 17, 23, 0.9);
  border: 1px solid #ff6b35;
  border-radius: 4px;
  color: #ffffff;
  font-family: sans-serif;
  font-size: 16px;
  font-weight: 500;
  padding: 4px 8px;
  outline: none;
  min-width: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
