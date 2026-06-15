import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Annotation } from '@/types/annotation'

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
  }
})
