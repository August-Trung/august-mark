import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Annotation } from '@/types/annotation'
import { saveCaptureAnnotations } from '@/services/tauriCommands'

export const useOverlayStore = defineStore('overlay', () => {
  const activeTool = ref<'marker' | 'rect' | 'arrow' | 'text' | null>(null)
  const annotations = ref<Annotation[]>([])
  const captureId = ref<string | null>(null)
  const screenshotPath = ref<string>('')
  const monitorInfo = ref<any>(null)
  const nextMarkerNumber = ref<number>(1)
  
  // Pending annotation state for T3.08
  const pendingAnnotation = ref<Annotation | null>(null)
  const showIssueForm = ref<boolean>(false)

  function init(id: string, path: string, info?: any) {
    captureId.value = id
    screenshotPath.value = path
    monitorInfo.value = info || null
    annotations.value = []
    nextMarkerNumber.value = 1
    activeTool.value = null
    pendingAnnotation.value = null
    showIssueForm.value = false
  }

  function setTool(tool: 'marker' | 'rect' | 'arrow' | 'text' | null) {
    activeTool.value = tool
  }

  function addAnnotation(annotation: Annotation) {
    annotations.value.push(annotation)
    nextMarkerNumber.value++
  }

  function removeAnnotation(id: string) {
    annotations.value = annotations.value.filter(a => a.id !== id)
  }

  function reset() {
    captureId.value = null
    screenshotPath.value = ''
    monitorInfo.value = null
    annotations.value = []
    nextMarkerNumber.value = 1
    activeTool.value = null
    pendingAnnotation.value = null
    showIssueForm.value = false
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
      } else if (ann.type === 'rect') {
        // Center crop on the middle of the rectangle
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
        tags: []
      }
    });

    try {
      await saveCaptureAnnotations(captureId.value, payloads, annotatedBase64)
      reset()
    } catch (e) {
      console.error('[OverlayStore] Failed to save annotations:', e)
      throw e
    }
  }

  return {
    activeTool,
    annotations,
    captureId,
    screenshotPath,
    monitorInfo,
    nextMarkerNumber,
    pendingAnnotation,
    showIssueForm,
    init,
    setTool,
    addAnnotation,
    removeAnnotation,
    reset,
    saveAndClose,
  }
})
