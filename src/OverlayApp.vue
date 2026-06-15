<template>
  <v-app class="overlay-app-wrapper">
    <div class="overlay-root">
      <!-- Status bar — always visible so user knows they can press Esc -->
      <OverlayStatusBar
        :session-name="sessionName"
        :issue-count="issueCount"
        @cancel="handleCancel"
        @done="handleDone"
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
          <span>{{ loadError || 'Loading screenshot...' }}</span>
        </div>
      </div>

      <!-- Bottom floating toolbar -->
      <AnnotationToolbar />

      <!-- Right side slide-in issue form -->
      <IssueFormPanel />
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
import type { Capture } from '@/types/capture'

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
    loadError.value = 'Failed to load screenshot. Press Esc to cancel.'
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
  loadError.value = 'Failed to display screenshot. Press Esc to cancel.'
  screenshotUrl.value = ''
  await revealOverlay()
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Ignore shortcuts when typing in inputs/textareas/contenteditable elements
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    (e.target as HTMLElement)?.isContentEditable
  ) {
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
  } else if (e.key === '1') {
    overlayStore.setTool('marker')
  } else if (e.key === '2') {
    overlayStore.setTool('rect')
  } else if (e.key === '3') {
    overlayStore.setTool('arrow')
  } else if (e.key === '4') {
    overlayStore.setTool('text')
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
})

onUnmounted(() => {
  if (unlistenInit) unlistenInit()
  if (revealFallbackTimer) window.clearTimeout(revealFallbackTimer)
  window.removeEventListener('keydown', handleKeyDown)
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
  background: transparent !important;
  background-color: transparent !important;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  overflow: hidden !important;
  background: transparent !important;
  background-color: transparent !important;
}

#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background: transparent !important;
  background-color: transparent !important;
}

.v-application {
  background: transparent !important;
  background-color: transparent !important;
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
  user-select: none;
}

.screenshot-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: transparent;
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
