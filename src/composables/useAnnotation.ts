import { ref, Ref, watch } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useCanvas } from './useCanvas'
import type { 
  Point, 
  MarkerAnnotation, 
  RectAnnotation, 
  ArrowAnnotation, 
  TextAnnotation, 
  BlurAnnotation, 
  HighlightAnnotation, 
  FreeDrawAnnotation,
  Annotation 
} from '@/types/annotation'

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
    renderText,
    renderFreeDraw,
    renderHighlight,
    renderBlur
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
      } else if (ann.type === 'blur') {
        const screenshotCanvas = drawingCanvasRef.value?.parentElement?.querySelector('.z-screenshot') as HTMLCanvasElement | null
        renderBlur(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, screenshotCanvas)
        renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, false, color)
      } else if (ann.type === 'highlight') {
        renderHighlight(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, false)
        renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, false, color)
      } else if (ann.type === 'freedraw') {
        renderFreeDraw(ctx, ann.points, color, 3)
        if (ann.points.length > 0) {
          renderMarker(ctx, ann.points[0].x, ann.points[0].y, ann.number, false, color)
        }
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
    } else if (ann.type === 'blur') {
      const screenshotCanvas = drawingCanvasRef.value?.parentElement?.querySelector('.z-screenshot') as HTMLCanvasElement | null
      renderBlur(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, screenshotCanvas)
      renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, true, color)
    } else if (ann.type === 'highlight') {
      renderHighlight(ctx, ann.topLeft.x, ann.topLeft.y, ann.width, ann.height, true)
      renderMarker(ctx, ann.topLeft.x, ann.topLeft.y - 20, ann.number, true, color)
    } else if (ann.type === 'freedraw') {
      renderFreeDraw(ctx, ann.points, color, 3)
      if (ann.points.length > 0) {
        renderMarker(ctx, ann.points[0].x, ann.points[0].y, ann.number, true, color)
      }
    }
  }

  // Handle mousedown events on top drawing canvas
  const handleMouseDown = (e: MouseEvent) => {
    // If the issue form is currently open, block drawing new shapes
    if (overlayStore.showIssueForm) return

    // Close context menu if open
    if (contextMenuState.value.visible) {
      contextMenuState.value.visible = false
      if (!findAnnotationAt(getCanvasCoords(drawingCanvasRef.value!, e))) {
        clearHover()
      }
      return
    }

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
    } else if (
      overlayStore.activeTool === 'rect' || 
      overlayStore.activeTool === 'arrow' || 
      overlayStore.activeTool === 'blur' || 
      overlayStore.activeTool === 'highlight'
    ) {
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
    } else if (overlayStore.activeTool === 'freedraw') {
      isDrawing.value = true
      startPoint.value = coords
      
      const freeAnn: FreeDrawAnnotation = {
        id: generateId(),
        type: 'freedraw',
        points: [coords],
        number: overlayStore.nextMarkerNumber,
        color: '#FF6B35',
        strokeWidth: 3
      }
      overlayStore.pendingAnnotation = freeAnn
    }
  }

  // Handle mousemove events on drawing canvas
  const handleMouseMove = (e: MouseEvent) => {
    if (!drawingCanvasRef.value || !getDrawingCtx()) return
    const coords = getCanvasCoords(drawingCanvasRef.value, e)
    const ctx = getDrawingCtx()!
    const canvas = drawingCanvasRef.value!

    // Hover hit-testing (when not drawing and not in form panel / text typing state)
    if (!isDrawing.value && !overlayStore.showIssueForm && !textInputState.value.visible) {
      const ann = findAnnotationAt(coords)
      if (ann) {
        if (hoveredAnnotationId.value !== ann.id) {
          hoveredAnnotationId.value = ann.id
          drawHoverHighlight()
        }
      } else {
        if (hoveredAnnotationId.value !== null) {
          hoveredAnnotationId.value = null
          clearCanvas(canvas, ctx)
        }
      }
      return
    }

    if (!isDrawing.value || !startPoint.value) return

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
    } else if (overlayStore.activeTool === 'blur') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      const screenshotCanvas = drawingCanvasRef.value?.parentElement?.querySelector('.z-screenshot') as HTMLCanvasElement | null
      renderBlur(ctx, x, y, width, height, screenshotCanvas)
      renderMarker(ctx, x, y - 20, overlayStore.nextMarkerNumber, true, '#FF6B35')
    } else if (overlayStore.activeTool === 'highlight') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      renderHighlight(ctx, x, y, width, height, true)
      renderMarker(ctx, x, y - 20, overlayStore.nextMarkerNumber, true, '#FF6B35')
    } else if (overlayStore.activeTool === 'freedraw') {
      const ann = overlayStore.pendingAnnotation
      if (ann && ann.type === 'freedraw') {
        ann.points.push(coords)
        renderFreeDraw(ctx, ann.points, '#FF6B35', 3)
        if (ann.points.length > 0) {
          renderMarker(ctx, ann.points[0].x, ann.points[0].y, overlayStore.nextMarkerNumber, true, '#FF6B35')
        }
      }
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
    } else if (overlayStore.activeTool === 'blur') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      const ctx = getDrawingCtx()
      if (ctx) clearCanvas(drawingCanvasRef.value, ctx)

      if (width > 5 && height > 5) {
        const blurAnn: BlurAnnotation = {
          id: generateId(),
          type: 'blur',
          topLeft: { x, y },
          width,
          height,
          blurRadius: 8,
          number: overlayStore.nextMarkerNumber,
          color: '#FF6B35',
          strokeWidth: 2,
          issue: {
            title: `Censored area #${overlayStore.nextMarkerNumber}`,
            issueType: 'UX',
            severity: 'Info',
            description: 'Sensible data blurred for privacy.'
          }
        }
        overlayStore.addAnnotation(blurAnn)
      }
    } else if (overlayStore.activeTool === 'highlight') {
      const x = Math.min(startPoint.value.x, coords.x)
      const y = Math.min(startPoint.value.y, coords.y)
      const width = Math.abs(coords.x - startPoint.value.x)
      const height = Math.abs(coords.y - startPoint.value.y)

      if (width > 5 && height > 5) {
        const highlightAnn: HighlightAnnotation = {
          id: generateId(),
          type: 'highlight',
          topLeft: { x, y },
          width,
          height,
          opacity: 0.35,
          number: overlayStore.nextMarkerNumber,
          color: '#FF6B35',
          strokeWidth: 2
        }
        overlayStore.pendingAnnotation = highlightAnn
        overlayStore.showIssueForm = true
      } else {
        const ctx = getDrawingCtx()
        if (ctx) clearCanvas(drawingCanvasRef.value, ctx)
      }
    } else if (overlayStore.activeTool === 'freedraw') {
      const ann = overlayStore.pendingAnnotation
      if (ann && ann.type === 'freedraw' && ann.points.length > 2) {
        overlayStore.showIssueForm = true
      } else {
        overlayStore.pendingAnnotation = null
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

  const hoveredAnnotationId = ref<string | null>(null)
  
  const contextMenuState = ref({
    visible: false,
    x: 0,
    y: 0,
    annotationId: ''
  })

  const distanceSq = (p1: Point, p2: Point) => {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return dx * dx + dy * dy
  }

  const distanceToSegmentSq = (p: Point, a: Point, b: Point) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return distanceSq(p, a)
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    return distanceSq(p, { x: a.x + t * dx, y: a.y + t * dy })
  }

  const getAnnotationBoundingBox = (ann: Annotation) => {
    if (ann.type === 'marker') {
      return {
        x: ann.position.x - 15,
        y: ann.position.y - 15,
        w: 30,
        h: 30
      }
    } else if (ann.type === 'rect' || ann.type === 'blur' || ann.type === 'highlight') {
      return {
        x: ann.topLeft.x,
        y: ann.topLeft.y,
        w: ann.width,
        h: ann.height
      }
    } else if (ann.type === 'arrow') {
      return {
        x: Math.min(ann.start.x, ann.end.x) - 10,
        y: Math.min(ann.start.y, ann.end.y) - 10,
        w: Math.abs(ann.end.x - ann.start.x) + 20,
        h: Math.abs(ann.end.y - ann.start.y) + 20
      }
    } else if (ann.type === 'text') {
      const w = ann.text.length * 9 + 16
      return {
        x: ann.position.x,
        y: ann.position.y,
        w,
        h: 28
      }
    } else if (ann.type === 'freedraw') {
      if (ann.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
      let minX = ann.points[0].x, maxX = ann.points[0].x
      let minY = ann.points[0].y, maxY = ann.points[0].y
      for (const pt of ann.points) {
        if (pt.x < minX) minX = pt.x
        if (pt.x > maxX) maxX = pt.x
        if (pt.y < minY) minY = pt.y
        if (pt.y > maxY) maxY = pt.y
      }
      return {
        x: minX - 10,
        y: minY - 10,
        w: (maxX - minX) + 20,
        h: (maxY - minY) + 20
      }
    }
    return { x: 0, y: 0, w: 0, h: 0 }
  }

  const findAnnotationAt = (coords: Point): Annotation | null => {
    for (let i = overlayStore.annotations.length - 1; i >= 0; i--) {
      const ann = overlayStore.annotations[i]
      if (ann.type === 'marker') {
        if (distanceSq(coords, ann.position) <= 18 * 18) {
          return ann
        }
      } else if (ann.type === 'rect' || ann.type === 'blur' || ann.type === 'highlight') {
        const xMin = Math.min(ann.topLeft.x, ann.topLeft.x + ann.width)
        const xMax = Math.max(ann.topLeft.x, ann.topLeft.x + ann.width)
        const yMin = Math.min(ann.topLeft.y, ann.topLeft.y + ann.height)
        const yMax = Math.max(ann.topLeft.y, ann.topLeft.y + ann.height)
        if (coords.x >= xMin && coords.x <= xMax && coords.y >= yMin && coords.y <= yMax) {
          return ann
        }
      } else if (ann.type === 'arrow') {
        if (distanceToSegmentSq(coords, ann.start, ann.end) <= 10 * 10) {
          return ann
        }
      } else if (ann.type === 'text') {
        const box = getAnnotationBoundingBox(ann)
        if (coords.x >= box.x && coords.x <= box.x + box.w && coords.y >= box.y && coords.y <= box.y + box.h) {
          return ann
        }
      } else if (ann.type === 'freedraw') {
        for (let j = 0; j < ann.points.length - 1; j++) {
          if (distanceToSegmentSq(coords, ann.points[j], ann.points[j+1]) <= 12 * 12) {
            return ann
          }
        }
      }
    }
    return null
  }

  const drawHoverHighlight = () => {
    const ctx = getDrawingCtx()
    const canvas = drawingCanvasRef.value
    if (!ctx || !canvas || !hoveredAnnotationId.value) return

    clearCanvas(canvas, ctx)

    const ann = overlayStore.annotations.find(a => a.id === hoveredAnnotationId.value)
    if (!ann) return

    const box = getAnnotationBoundingBox(ann)
    ctx.save()
    ctx.strokeStyle = '#2196F3'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.strokeRect(box.x, box.y, box.w, box.h)
    ctx.restore()
  }

  const handleContextMenu = (e: MouseEvent) => {
    if (overlayStore.showIssueForm) return
    if (!drawingCanvasRef.value) return

    const coords = getCanvasCoords(drawingCanvasRef.value, e)
    const ann = findAnnotationAt(coords)
    if (ann) {
      e.preventDefault()
      // Highlight the right-clicked annotation immediately
      hoveredAnnotationId.value = ann.id
      drawHoverHighlight()

      contextMenuState.value = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        annotationId: ann.id
      }
    } else {
      contextMenuState.value.visible = false
    }
  }

  const deleteAnnotationById = (id: string) => {
    overlayStore.removeAnnotation(id)
    if (hoveredAnnotationId.value === id) {
      hoveredAnnotationId.value = null
      if (drawingCanvasRef.value && getDrawingCtx()) {
        clearCanvas(drawingCanvasRef.value, getDrawingCtx()!)
      }
    }
    if (contextMenuState.value.annotationId === id) {
      contextMenuState.value.visible = false
    }
  }

  const clearHover = () => {
    hoveredAnnotationId.value = null
    if (drawingCanvasRef.value && getDrawingCtx()) {
      clearCanvas(drawingCanvasRef.value, getDrawingCtx()!)
    }
  }

  // Watch for activeTool changes to close context menu and clear hover
  watch(() => overlayStore.activeTool, () => {
    contextMenuState.value.visible = false
    clearHover()
  })

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
    hoveredAnnotationId,
    contextMenuState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    deleteAnnotationById,
    clearHover,
    commitTextInput,
    cancelTextInput,
    redrawCommittedCanvas,
  }
}
