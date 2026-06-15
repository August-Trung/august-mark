import { ref, Ref, watch } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useCanvas } from './useCanvas'
import type { Point, MarkerAnnotation, RectAnnotation, ArrowAnnotation, TextAnnotation } from '@/types/annotation'

// Utility to generate unique IDs
const generateId = () => {
  return typeof crypto.randomUUID === 'function' 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 11)
}

export function useAnnotation(
  markerCanvasRef: Ref<HTMLCanvasElement | null>,
  drawingCanvasRef: Ref<HTMLCanvasElement | null>,
  getMarkerCtx: () => CanvasRenderingContext2D | null,
  getDrawingCtx: () => CanvasRenderingContext2D | null
) {
  const overlayStore = useOverlayStore()
  const { 
    getCanvasCoords, 
    clearCanvas, 
    renderMarker, 
    renderRect, 
    renderArrow, 
    renderText 
  } = useCanvas()

  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)

  // Floating text input state
  const textInputState = ref({
    visible: false,
    x: 0,
    y: 0,
    text: ''
  })

  /**
   * Clears and redraws the committed canvas layer with all confirmed annotations.
   */
  const redrawCommittedCanvas = () => {
    const ctx = getMarkerCtx()
    const canvas = markerCanvasRef.value
    if (!ctx || !canvas) return

    clearCanvas(canvas, ctx)

    for (const ann of overlayStore.annotations) {
      const color = ann.color || '#FF6B35'
      if (ann.type === 'marker') {
        renderMarker(ctx, ann.position.x, ann.position.y, ann.number, false, color)
      } else if (ann.type === 'rect') {
        renderRect(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, false, color)
        renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, false, color)
      } else if (ann.type === 'arrow') {
        renderArrow(ctx, ann.start.x, ann.start.y, ann.end.x, ann.end.y, false, color)
        renderMarker(ctx, ann.start.x, ann.start.y, ann.number, false, color)
      } else if (ann.type === 'text') {
        renderText(ctx, ann.position.x, ann.position.y, ann.text, '#FFFFFF', 'rgba(15, 17, 23, 0.85)')
        renderMarker(ctx, ann.position.x - 20, ann.position.y + 12, ann.number, false, color)
      }
    }
  }

  /**
   * Renders the preview of the pending annotation on the active drawing canvas layer.
   */
  const drawPendingPreview = () => {
    const ctx = getDrawingCtx()
    const canvas = drawingCanvasRef.value
    if (!ctx || !canvas) return

    clearCanvas(canvas, ctx)

    const ann = overlayStore.pendingAnnotation
    if (!ann) return

    const color = ann.color || '#FF6B35'
    if (ann.type === 'marker') {
      renderMarker(ctx, ann.position.x, ann.position.y, ann.number, true, color)
    } else if (ann.type === 'rect') {
      renderRect(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, true, color)
      renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, true, color)
    } else if (ann.type === 'arrow') {
      renderArrow(ctx, ann.start.x, ann.start.y, ann.end.x, ann.end.y, true, color)
      renderMarker(ctx, ann.start.x, ann.start.y, ann.number, true, color)
    } else if (ann.type === 'text') {
      renderText(ctx, ann.position.x, ann.position.y, ann.text, '#FFFFFF', 'rgba(15, 17, 23, 0.85)')
      renderMarker(ctx, ann.position.x - 20, ann.position.y + 12, ann.number, true, color)
    }
  }

  // Handle mousedown events on top drawing canvas
  const handleMouseDown = (e: MouseEvent) => {
    // If the issue form is currently open, block drawing new shapes
    if (overlayStore.showIssueForm) return

    // If text input is open, handle clicking outside
    if (textInputState.value.visible) {
      if (textInputState.value.text.trim()) {
        commitTextInput()
      } else {
        cancelTextInput()
      }
      return
    }

    if (!drawingCanvasRef.value || !overlayStore.activeTool) return
    const coords = getCanvasCoords(drawingCanvasRef.value, e)

    if (overlayStore.activeTool === 'marker') {
      // Place numbered marker directly
      const markerAnn: MarkerAnnotation = {
        id: generateId(),
        type: 'marker',
        position: coords,
        number: overlayStore.nextMarkerNumber,
        color: '#FF6B35',
        strokeWidth: 2
      }
      overlayStore.pendingAnnotation = markerAnn
      overlayStore.showIssueForm = true
    } else if (overlayStore.activeTool === 'rect' || overlayStore.activeTool === 'arrow') {
      isDrawing.value = true
      startPoint.value = coords
    } else if (overlayStore.activeTool === 'text') {
      // Show text input field
      textInputState.value = {
        visible: true,
        x: coords.x,
        y: coords.y,
        text: ''
      }
    }
  }

  // Handle mousemove events on drawing canvas
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing.value || !startPoint.value || !drawingCanvasRef.value || !getDrawingCtx()) return
    const coords = getCanvasCoords(drawingCanvasRef.value, e)
    const ctx = getDrawingCtx()!
    const canvas = drawingCanvasRef.value!

    clearCanvas(canvas, ctx)

    if (overlayStore.activeTool === 'rect') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      renderRect(ctx, x, y, width, height, true, '#FF6B35')
      renderMarker(ctx, x, y - 20, overlayStore.nextMarkerNumber, true, '#FF6B35')
    } else if (overlayStore.activeTool === 'arrow') {
      renderArrow(ctx, startPoint.value.x, startPoint.value.y, coords.x, coords.y, true, '#FF6B35')
      renderMarker(ctx, startPoint.value.x, startPoint.value.y, overlayStore.nextMarkerNumber, true, '#FF6B35')
    }
  }

  // Handle mouseup events on drawing canvas
  const handleMouseUp = (e: MouseEvent) => {
    if (!isDrawing.value || !startPoint.value || !drawingCanvasRef.value) return
    isDrawing.value = false

    const coords = getCanvasCoords(drawingCanvasRef.value, e)

    if (overlayStore.activeTool === 'rect') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      // Only register if rectangle has a minimum size
      if (width > 5 && height > 5) {
        const rectAnn: RectAnnotation = {
          id: generateId(),
          type: 'rect',
          topLeft: { x, y },
          width,
          height,
          number: overlayStore.nextMarkerNumber,
          color: '#FF6B35',
          strokeWidth: 2
        }
        overlayStore.pendingAnnotation = rectAnn
        overlayStore.showIssueForm = true
      } else {
        // Clear preview if too small
        const ctx = getDrawingCtx()
        if (ctx) clearCanvas(drawingCanvasRef.value, ctx)
      }
    } else if (overlayStore.activeTool === 'arrow') {
      const dx = coords.x - startPoint.value.x
      const dy = coords.y - startPoint.value.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Only register if arrow has a minimum length
      if (distance > 5) {
        const arrowAnn: ArrowAnnotation = {
          id: generateId(),
          type: 'arrow',
          start: startPoint.value,
          end: coords,
          number: overlayStore.nextMarkerNumber,
          color: '#FF6B35',
          strokeWidth: 2
        }
        overlayStore.pendingAnnotation = arrowAnn
        overlayStore.showIssueForm = true
      } else {
        const ctx = getDrawingCtx()
        if (ctx) clearCanvas(drawingCanvasRef.value, ctx)
      }
    }

    startPoint.value = null
  }

  /**
   * Commits the floating text input to a pending text annotation.
   */
  const commitTextInput = () => {
    if (!textInputState.value.text.trim()) {
      cancelTextInput()
      return
    }

    const textAnn: TextAnnotation = {
      id: generateId(),
      type: 'text',
      position: { x: textInputState.value.x, y: textInputState.value.y },
      text: textInputState.value.text,
      fontSize: 16,
      number: overlayStore.nextMarkerNumber,
      color: '#FF6B35',
      strokeWidth: 2
    }

    textInputState.value.visible = false
    overlayStore.pendingAnnotation = textAnn
    overlayStore.showIssueForm = true
  }

  const cancelTextInput = () => {
    textInputState.value.visible = false
    textInputState.value.text = ''
    const ctx = getDrawingCtx()
    if (ctx && drawingCanvasRef.value) {
      clearCanvas(drawingCanvasRef.value, ctx)
    }
  }

  // Watch for pendingAnnotation changes to trigger drawing layer 3 updates
  watch(() => overlayStore.pendingAnnotation, () => {
    drawPendingPreview()
  })

  // Watch for annotations list updates to redraw committed layer 2
  watch(() => overlayStore.annotations, () => {
    redrawCommittedCanvas()
  }, { deep: true })

  return {
    isDrawing,
    textInputState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    commitTextInput,
    cancelTextInput,
    redrawCommittedCanvas,
  }
}
