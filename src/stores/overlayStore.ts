import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Annotation } from '@/types/annotation'
import { saveCaptureAnnotations } from '@/services/tauriCommands'
import { useUiStore } from './uiStore'
import { useI18n } from '@/composables/useI18n'

export interface HistoryAction {
  type: 'add' | 'delete'
  annotation: Annotation
  index?: number
}

export const useOverlayStore = defineStore('overlay', () => {
  const activeTool = ref<'marker' | 'rect' | 'arrow' | 'text' | 'blur' | 'freedraw' | 'highlight' | null>(null)
  const annotations = ref<Annotation[]>([])
  const undoStack = ref<HistoryAction[]>([])
  const redoStack = ref<HistoryAction[]>([])
  const captureId = ref<string | null>(null)
  const screenshotPath = ref<string>('')
  const monitorInfo = ref<any>(null)
  const nextMarkerNumber = ref<number>(1)
  
  // Pending annotation state for T3.08
  const pendingAnnotation = ref<Annotation | null>(null)
  const showIssueForm = ref<boolean>(false)
  
  // Current active form inputs for copy-with-metadata accessibility
  const currentFormTitle = ref<string>('')
  const currentFormDescription = ref<string>('')
  const currentFormSeverity = ref<string>('Minor')

  function init(id: string, path: string, info?: any) {
    captureId.value = id
    screenshotPath.value = path
    monitorInfo.value = info || null
    annotations.value = []
    undoStack.value = []
    redoStack.value = []
    nextMarkerNumber.value = 1
    activeTool.value = null
    pendingAnnotation.value = null
    showIssueForm.value = false
    currentFormTitle.value = ''
    currentFormDescription.value = ''
    currentFormSeverity.value = 'Minor'
  }

  function setTool(tool: 'marker' | 'rect' | 'arrow' | 'text' | 'blur' | 'freedraw' | 'highlight' | null) {
    activeTool.value = tool
  }

  function addAnnotation(annotation: Annotation) {
    annotations.value.push(annotation)
    nextMarkerNumber.value++
    undoStack.value.push({ type: 'add', annotation })
    redoStack.value = []
  }

  function removeAnnotation(id: string) {
    const idx = annotations.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      const annotation = annotations.value[idx]
      annotations.value.splice(idx, 1)
      undoStack.value.push({ type: 'delete', annotation, index: idx })
      redoStack.value = []
    }
  }

  function reset() {
    captureId.value = null
    screenshotPath.value = ''
    monitorInfo.value = null
    annotations.value = []
    undoStack.value = []
    redoStack.value = []
    nextMarkerNumber.value = 1
    activeTool.value = null
    pendingAnnotation.value = null
    showIssueForm.value = false
    currentFormTitle.value = ''
    currentFormDescription.value = ''
    currentFormSeverity.value = 'Minor'
  }

  function undo() {
    if (undoStack.value.length === 0) return
    const action = undoStack.value.pop()
    if (!action) return

    if (action.type === 'add') {
      annotations.value = annotations.value.filter(a => a.id !== action.annotation.id)
      nextMarkerNumber.value = Math.max(1, nextMarkerNumber.value - 1)
    } else if (action.type === 'delete') {
      const insertIdx = action.index !== undefined ? action.index : annotations.value.length
      annotations.value.splice(insertIdx, 0, action.annotation)
    }
    redoStack.value.push(action)
  }

  function redo() {
    if (redoStack.value.length === 0) return
    const action = redoStack.value.pop()
    if (!action) return

    if (action.type === 'add') {
      annotations.value.push(action.annotation)
      nextMarkerNumber.value++
    } else if (action.type === 'delete') {
      annotations.value = annotations.value.filter(a => a.id !== action.annotation.id)
    }
    undoStack.value.push(action)
  }

  async function saveAndClose(annotatedBase64?: string) {
    if (!captureId.value) return

    const payloads = annotations.value.map(ann => {
      const issue = ann.issue || {
        title: `Annotation #${ann.number}`,
        issueType: 'Bug',
        severity: 'Minor',
        description: ''
      }

      // Calculate marker_x, marker_y centered around the point of interest
      let markerX = 0
      let markerY = 0
      if (ann.type === 'marker') {
        markerX = ann.position.x
        markerY = ann.position.y
      } else if (ann.type === 'rect' || ann.type === 'blur' || ann.type === 'highlight') {
        // Center crop on the middle of the region
        markerX = ann.topLeft.x + ann.width / 2
        markerY = ann.topLeft.y + ann.height / 2
      } else if (ann.type === 'arrow') {
        // Center crop on the arrowhead (pointing target) instead of the tail
        markerX = ann.end.x
        markerY = ann.end.y
      } else if (ann.type === 'text') {
        // Center crop on the text block position
        markerX = ann.position.x
        markerY = ann.position.y
      } else if (ann.type === 'freedraw') {
        // Center crop on the center of the freehand stroke's bounding box
        if (ann.points && ann.points.length > 0) {
          let minX = ann.points[0].x
          let maxX = ann.points[0].x
          let minY = ann.points[0].y
          let maxY = ann.points[0].y
          for (const pt of ann.points) {
            if (pt.x < minX) minX = pt.x
            if (pt.x > maxX) maxX = pt.x
            if (pt.y < minY) minY = pt.y
            if (pt.y > maxY) maxY = pt.y
          }
          markerX = minX + (maxX - minX) / 2
          markerY = minY + (maxY - minY) / 2
        }
      }

      // Scale to physical coordinates matching the physical image size
      const dpr = monitorInfo.value?.scaleFactor || window.devicePixelRatio || 1
      const physicalX = markerX * dpr
      const physicalY = markerY * dpr

      return {
        markerNumber: ann.number,
        title: issue.title,
        description: issue.description,
        issueType: issue.issueType,
        severity: issue.severity,
        status: 'Open',
        markerX: Math.round(physicalX),
        markerY: Math.round(physicalY),
        annotationData: JSON.stringify(ann),
        color: ann.color || '#FF6B35',
        strokeWidth: ann.strokeWidth || 2,
        tags: issue.tags || []
      }
    });

    try {
      const uiStore = useUiStore()
      uiStore.setLoading(true)
      await saveCaptureAnnotations(captureId.value, payloads, annotatedBase64)
      reset()
      const { t } = useI18n()
      uiStore.showToast({ message: t('toasts.annotationsSaved'), type: 'success' })
    } catch (e: any) {
      console.error('[OverlayStore] Failed to save annotations:', e)
      const uiStore = useUiStore()
      const { t } = useI18n()
      uiStore.showToast({ message: t('toasts.failedSaveAnnotations', { msg: e?.message || String(e) }), type: 'error' })
      throw e
    } finally {
      const uiStore = useUiStore()
      uiStore.setLoading(false)
    }
  }

  return {
    activeTool,
    annotations,
    undoStack,
    redoStack,
    captureId,
    screenshotPath,
    monitorInfo,
    nextMarkerNumber,
    pendingAnnotation,
    showIssueForm,
    currentFormTitle,
    currentFormDescription,
    currentFormSeverity,
    init,
    setTool,
    addAnnotation,
    removeAnnotation,
    reset,
    saveAndClose,
    undo,
    redo,
  }
})
