<template>
  <div class="overlay-root">
    <!-- Status bar — always visible so user knows they can press Esc -->
    <OverlayStatusBar
      :session-name="sessionName"
      :issue-count="issueCount"
      @cancel="handleCancel"
      @done="handleDone"
    />

    <!-- Fullscreen screenshot -->
    <div class="screenshot-wrapper">
      <img
        v-if="screenshotUrl"
        :src="screenshotUrl"
        class="screenshot-img"
        alt="Screenshot"
        @load="handleScreenshotLoad"
        @error="handleScreenshotError"
      />
      <!-- Loading placeholder while screenshot loads -->
      <div v-else class="loading-placeholder">
        <span>{{ loadError || 'Loading screenshot...' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { listenToEvent } from '@/services/tauriEvents'
import { getCapture, getSession, cancelCapture, closeOverlay, showOverlay } from '@/services/tauriCommands'
import OverlayStatusBar from '@/components/overlay/OverlayStatusBar.vue'
import type { Capture } from '@/types/capture'

const captureId = ref<string | null>(null)
const capture = ref<Capture | null>(null)
const screenshotUrl = ref<string>('')
const sessionName = ref<string>('Quick Review')
const issueCount = ref<number>(0)
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
  if (e.key === 'Escape') {
    handleCancel()
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
  await closeOverlay()
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
})
</script>

<style>
/*
  CRITICAL: Full transparent reset — Vuetify is NOT loaded in this window.
  These rules override all browser defaults to keep the window see-through.
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

.screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
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
