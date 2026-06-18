<template>
  <v-app class="overlay-app-wrapper">
    <div class="overlay-root">
      <!-- Status bar — always visible so user knows they can press Esc -->
      <OverlayStatusBar
        :session-name="sessionName"
        :issue-count="issueCount"
        @cancel="handleCancel"
        @done="handleDone"
        @copy="handleGlobalCopy"
      />

      <!-- Fullscreen screenshot and drawing canvas -->
      <div class="screenshot-wrapper">
        <AnnotationCanvas
          v-if="screenshotUrl"
          ref="annotationCanvasRef"
          :screenshot-url="screenshotUrl"
          @load="handleScreenshotLoad"
          @error="handleScreenshotError"
        />
        <!-- Loading placeholder while screenshot loads -->
        <div v-else class="loading-placeholder">
          <span>{{ loadError || t('overlay.loadingScreenshot') }}</span>
        </div>
      </div>

      <!-- Bottom floating toolbar -->
      <AnnotationToolbar />

      <!-- Right side slide-in issue form -->
      <IssueFormPanel @copy="handleIssueCopy" />
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted, computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { listenToEvent } from '@/services/tauriEvents'
import { getCapture, getSession, cancelCapture, closeOverlay, showOverlay } from '@/services/tauriCommands'
import OverlayStatusBar from '@/components/overlay/OverlayStatusBar.vue'
import AnnotationCanvas from '@/components/overlay/AnnotationCanvas.vue'
import AnnotationToolbar from '@/components/overlay/AnnotationToolbar.vue'
import IssueFormPanel from '@/components/overlay/IssueFormPanel.vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useUiStore } from '@/stores/uiStore'
import { useI18n } from '@/composables/useI18n'
import type { Capture } from '@/types/capture'

const { t } = useI18n()
const overlayStore = useOverlayStore()
const annotationCanvasRef = ref<any>(null)

const captureId = ref<string | null>(null)
const capture = ref<Capture | null>(null)
const screenshotUrl = ref<string>('')
const sessionName = ref<string>('Quick Review')
const issueCount = computed(() => overlayStore.annotations.length)
const loadError = ref<string | null>(null)

let unlistenInit: (() => void) | null = null
let hasShownOverlay = false
let revealFallbackTimer: ReturnType<typeof window.setTimeout> | null = null

const revealOverlay = async () => {
  if (hasShownOverlay) return

  await nextTick()
  if (hasShownOverlay) return
  await showOverlay()
  hasShownOverlay = true
}

const scheduleRevealFallback = () => {
  if (revealFallbackTimer) {
    window.clearTimeout(revealFallbackTimer)
  }

  revealFallbackTimer = window.setTimeout(() => {
    revealOverlay().catch((e) => {
      console.error('[Overlay] Failed to reveal overlay:', e)
    })
  }, 500)
}

const loadCaptureDetails = async (id: string) => {
  try {
    captureId.value = id
    loadError.value = null
    screenshotUrl.value = ''
    const data = await getCapture(id)
    capture.value = data

    overlayStore.init(id, data.screenshotPath, data)

    // Convert to Tauri asset:// URL for local file access
    screenshotUrl.value = convertFileSrc(data.screenshotPath)
    scheduleRevealFallback()

    // Load session name for display
    try {
      const sessionData = await getSession(data.sessionId)
      sessionName.value = sessionData.title
    } catch {
      // Non-critical — default name already set
    }
  } catch (e) {
    console.error('[Overlay] Failed to load capture details:', e)
    loadError.value = t('overlay.failedLoadScreenshot')
    await revealOverlay()
  }
}

const loadCaptureFromUrl = async (id: string, path: string) => {
  captureId.value = id
  loadError.value = null
  overlayStore.init(id, path)
  screenshotUrl.value = convertFileSrc(path)
  scheduleRevealFallback()
}

const handleScreenshotLoad = async () => {
  await revealOverlay()
}

const handleScreenshotError = async () => {
  loadError.value = t('overlay.failedDisplayScreenshot')
  screenshotUrl.value = ''
  await revealOverlay()
}

const isDocumentComposing = ref(false)

const onCompositionStart = () => {
  isDocumentComposing.value = true
}

const onCompositionEnd = () => {
  isDocumentComposing.value = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Ignore shortcuts when typing in inputs/textareas/contenteditable elements or composing IME
  const target = e.target as HTMLElement
  if (
    isDocumentComposing.value ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable
  ) {
    return
  }

  // Ctrl+Z (Undo) and Ctrl+Y (Redo)
  if (e.ctrlKey) {
    if (e.key.toLowerCase() === 'z') {
      e.preventDefault()
      overlayStore.undo()
    } else if (e.key.toLowerCase() === 'y') {
      e.preventDefault()
      overlayStore.redo()
    } else if (e.key.toLowerCase() === 'c') {
      e.preventDefault()
      handleGlobalCopy()
    }
    return
  }

  if (e.key === 'Escape') {
    if (overlayStore.showIssueForm) {
      // Close the issue form and discard the pending annotation
      overlayStore.showIssueForm = false
      overlayStore.pendingAnnotation = null
    } else {
      handleCancel()
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (annotationCanvasRef.value?.hoveredAnnotationId) {
      overlayStore.removeAnnotation(annotationCanvasRef.value.hoveredAnnotationId)
      annotationCanvasRef.value.clearHover()
    }
  } else if (e.key === '1') {
    overlayStore.setTool('marker')
  } else if (e.key === '2') {
    overlayStore.setTool('rect')
  } else if (e.key === '3') {
    overlayStore.setTool('arrow')
  } else if (e.key === '4') {
    overlayStore.setTool('text')
  } else if (e.key === '5') {
    overlayStore.setTool('blur')
  } else if (e.key === '6') {
    overlayStore.setTool('freedraw')
  } else if (e.key === '7') {
    overlayStore.setTool('highlight')
  }
}

const handleCancel = async () => {
  if (captureId.value) {
    await cancelCapture(captureId.value)
  } else {
    await closeOverlay()
  }
}

const handleDone = async () => {
  try {
    let annotatedBase64: string | undefined = undefined
    if (annotationCanvasRef.value) {
      let screenshotCanvas = annotationCanvasRef.value.screenshotCanvasRef
      let markerCanvas = annotationCanvasRef.value.markerCanvasRef
      
      // Handle Vue Ref wrappers if they aren't auto-unwrapped
      if (screenshotCanvas && typeof screenshotCanvas === 'object' && 'value' in screenshotCanvas) {
        screenshotCanvas = screenshotCanvas.value
      }
      if (markerCanvas && typeof markerCanvas === 'object' && 'value' in markerCanvas) {
        markerCanvas = markerCanvas.value
      }

      if (screenshotCanvas && markerCanvas) {
        // Create a temporary canvas to merge them
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = screenshotCanvas.width
        tempCanvas.height = screenshotCanvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCtx.drawImage(screenshotCanvas, 0, 0)
          tempCtx.drawImage(markerCanvas, 0, 0)
          annotatedBase64 = tempCanvas.toDataURL('image/png')
        }
      } else {
        console.warn('[OverlayApp] Canvases not found or not initialized:', {
          screenshotCanvas: !!screenshotCanvas,
          markerCanvas: !!markerCanvas
        })
      }
    }

    await overlayStore.saveAndClose(annotatedBase64)
  } catch (e: any) {
    console.error('[OverlayApp] Failed to save annotations:', e?.message || e, e?.stack || '')
  }
}

const isCopying = ref(false)

const copyAnnotatedImage = async (metadata?: { title: string; description: string; severity: string; markerNumber: number }) => {
  if (isCopying.value) return
  isCopying.value = true
  const uiStore = useUiStore()

  try {
    if (!annotationCanvasRef.value) throw new Error('Canvas ref not found')
    
    let screenshotCanvas = annotationCanvasRef.value.screenshotCanvasRef
    let markerCanvas = annotationCanvasRef.value.markerCanvasRef
    
    if (screenshotCanvas && typeof screenshotCanvas === 'object' && 'value' in screenshotCanvas) {
      screenshotCanvas = screenshotCanvas.value
    }
    if (markerCanvas && typeof markerCanvas === 'object' && 'value' in markerCanvas) {
      markerCanvas = markerCanvas.value
    }

    if (!screenshotCanvas || !markerCanvas) {
      throw new Error('Canvases not initialized')
    }

    // Merge both canvases
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = screenshotCanvas.width
    tempCanvas.height = screenshotCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) throw new Error('Could not get temp canvas context')

    tempCtx.drawImage(screenshotCanvas, 0, 0)
    tempCtx.drawImage(markerCanvas, 0, 0)

    let finalCanvas = tempCanvas

    // If metadata is provided, draw the card footer (similar to IssueDetail.vue)
    if (metadata) {
      const width = tempCanvas.width
      const height = tempCanvas.height

      // Proportional sizing based on the screenshot width
      const footerHeight = Math.max(90, Math.round(width * 0.08))
      const fontSizeTitle = Math.max(16, Math.round(footerHeight * 0.22))
      const fontSizeDesc = Math.max(12, Math.round(footerHeight * 0.16))
      const padding = Math.round(footerHeight * 0.15)

      finalCanvas = document.createElement('canvas')
      finalCanvas.width = width
      finalCanvas.height = height + footerHeight
      const finalCtx = finalCanvas.getContext('2d')
      if (!finalCtx) throw new Error('Could not get final canvas context')

      // Draw the merged image
      finalCtx.drawImage(tempCanvas, 0, 0)

      // Draw dark footer background
      finalCtx.fillStyle = '#1A1D27'
      finalCtx.fillRect(0, height, width, footerHeight)

      // Draw border
      finalCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      finalCtx.lineWidth = Math.max(1, Math.round(width * 0.001))
      finalCtx.beginPath()
      finalCtx.moveTo(0, height)
      finalCtx.lineTo(width, height)
      finalCtx.stroke()

      // Draw marker circle
      const markerRadius = Math.max(12, Math.round(footerHeight * 0.18))
      const markerX = padding + markerRadius
      const markerY = height + padding + markerRadius
      finalCtx.fillStyle = '#FF6B35' // Primary accent
      finalCtx.beginPath()
      finalCtx.arc(markerX, markerY, markerRadius, 0, Math.PI * 2)
      finalCtx.fill()

      // Draw marker text
      finalCtx.fillStyle = '#FFFFFF'
      finalCtx.font = `bold ${Math.round(markerRadius * 1.1)}px sans-serif`
      finalCtx.textAlign = 'center'
      finalCtx.textBaseline = 'middle'
      finalCtx.fillText(String(metadata.markerNumber), markerX, markerY)

      // Draw Title
      const titleX = markerX + markerRadius + padding
      const titleY = height + padding + (markerRadius * 0.6)
      finalCtx.fillStyle = '#FFFFFF'
      finalCtx.font = `bold ${fontSizeTitle}px sans-serif`
      finalCtx.textAlign = 'left'
      finalCtx.textBaseline = 'top'
      
      const titleText = metadata.title || 'Issue'
      finalCtx.fillText(titleText, titleX, titleY)

      // Draw Severity Tag
      const titleWidth = finalCtx.measureText(titleText).width
      const tagX = titleX + titleWidth + padding
      const tagY = titleY
      const tagHeight = fontSizeTitle * 1.2
      
      finalCtx.font = `bold ${Math.round(fontSizeTitle * 0.75)}px sans-serif`
      const tagText = metadata.severity.toUpperCase()
      const tagTextWidth = finalCtx.measureText(tagText).width
      const tagPadding = Math.round(fontSizeTitle * 0.4)
      const tagWidth = tagTextWidth + tagPadding * 2

      finalCtx.fillStyle = metadata.severity === 'Critical' ? '#FF4757' : 
                          metadata.severity === 'Major' ? '#FFA502' : 
                          metadata.severity === 'Minor' ? '#2ED573' : '#3742FA'
      
      const radius = Math.round(tagHeight * 0.25)
      finalCtx.beginPath()
      if (finalCtx.roundRect) {
        finalCtx.roundRect(tagX, tagY, tagWidth, tagHeight, radius)
      } else {
        finalCtx.rect(tagX, tagY, tagWidth, tagHeight)
      }
      finalCtx.fill()

      finalCtx.fillStyle = '#FFFFFF'
      finalCtx.textAlign = 'center'
      finalCtx.textBaseline = 'middle'
      finalCtx.fillText(tagText, tagX + tagWidth / 2, tagY + tagHeight / 2)

      // Draw Description
      const descX = titleX
      const descY = titleY + fontSizeTitle + padding * 0.8
      finalCtx.fillStyle = '#A0A5B5' // Muted text
      finalCtx.font = `${fontSizeDesc}px sans-serif`
      finalCtx.textAlign = 'left'
      finalCtx.textBaseline = 'top'

      const maxTextWidth = width - descX - padding
      const descText = metadata.description || t('common.noDescription')

      // Word wrapping with manual newlines support
      const paragraphs = descText.split('\n')
      const lines: string[] = []
      
      for (const paragraph of paragraphs) {
        const words = paragraph.split(' ')
        let line = ''
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' '
          const metrics = finalCtx.measureText(testLine)
          const testWidth = metrics.width
          if (testWidth > maxTextWidth && n > 0) {
            lines.push(line)
            line = words[n] + ' '
          } else {
            line = testLine
          }
        }
        lines.push(line)
      }

      const maxLines = 2
      for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
        let lineText = lines[i]
        if (i === maxLines - 1 && lines.length > maxLines) {
          lineText = lineText.trim().substring(0, Math.max(0, lineText.length - 4)) + '...'
        }
        finalCtx.fillText(lineText, descX, descY + (i * (fontSizeDesc + padding * 0.4)))
      }
    }

    // Convert to blob and write to clipboard
    const blob: Blob | null = await new Promise((resolve) => finalCanvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not create blob')

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])

    uiStore.showToast({
      message: metadata ? t('issueDetail.copyImageSuccess') : t('issueDetail.copyImageSuccessSimple'),
      type: 'success'
    })
  } catch (err: any) {
    console.error('[OverlayApp] Failed to copy image:', err)
    uiStore.showToast({ message: t('issueDetail.copyImageError'), type: 'error' })
  } finally {
    isCopying.value = false
  }
}

const handleGlobalCopy = () => {
  copyAnnotatedImage()
}

const handleIssueCopy = (payload: { title: string; description: string; severity: string }) => {
  copyAnnotatedImage({
    title: payload.title,
    description: payload.description,
    severity: payload.severity,
    markerNumber: overlayStore.nextMarkerNumber
  })
}

onMounted(async () => {
  // Try reading initial data injected from Rust first
  const initialData = (window as any).__INITIAL_DATA__
  console.log('[Overlay] Initial data from Rust injection:', initialData)

  if (initialData && initialData.captureId && initialData.screenshotPath) {
    await loadCaptureFromUrl(initialData.captureId, initialData.screenshotPath)
  } else {
    // Fallback: read captureId from URL query param
    const params = new URLSearchParams(window.location.search)
    const idParam = params.get('captureId')
    const screenshotPathParam = params.get('screenshotPath')

    if (idParam && screenshotPathParam) {
      await loadCaptureFromUrl(idParam, screenshotPathParam)
    } else if (idParam) {
      await loadCaptureDetails(idParam)
    }
  }

  // Secondary: listen for overlay:init event (backup for late arrivals)
  unlistenInit = await listenToEvent<string>('overlay:init', async (id) => {
    if (!captureId.value) {
      await loadCaptureDetails(id)
    }
  })

  // Keyboard shortcut to cancel
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('compositionstart', onCompositionStart)
  document.addEventListener('compositionend', onCompositionEnd)
})

onUnmounted(() => {
  if (unlistenInit) unlistenInit()
  if (revealFallbackTimer) window.clearTimeout(revealFallbackTimer)
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('compositionstart', onCompositionStart)
  document.removeEventListener('compositionend', onCompositionEnd)
  overlayStore.reset()
})
</script>

<style>
/*
  CRITICAL: Full transparent reset — Vuetify overrides to keep window transparent.
*/
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  overflow: hidden !important;
  background: #121212 !important;
  background-color: #121212 !important;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  overflow: hidden !important;
  background: #121212 !important;
  background-color: #121212 !important;
}

#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background: #121212 !important;
  background-color: #121212 !important;
}

.v-application {
  background: #121212 !important;
  background-color: #121212 !important;
}

.v-application__wrap {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 100vh !important;
}
</style>

<style scoped>
.overlay-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: transparent;
  margin: 0;
  padding: 0;
}

.screenshot-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.7);
  font-family: -apple-system, sans-serif;
  font-size: 1rem;
}
</style>
