<template>
  <div class="overlay-status-bar">
    <div class="bar-left">
      <span class="session-badge">Session</span>
      <span class="session-name">{{ sessionName }}</span>
      <span class="divider"></span>
      <span class="issue-count">{{ t('overlay.issuesMarked', { count: issueCount }) }}</span>
    </div>
    <div class="bar-right">
      <button
        type="button"
        class="btn-history mr-2"
        :disabled="!canUndo"
        :title="t('overlay.undo', 'Undo') + ' (Ctrl+Z)'"
        @click="overlayStore.undo()"
      >
        <i class="mdi mdi-undo"></i>
      </button>
      <button
        type="button"
        class="btn-history mr-4"
        :disabled="!canRedo"
        :title="t('overlay.redo', 'Redo') + ' (Ctrl+Y)'"
        @click="overlayStore.redo()"
      >
        <i class="mdi mdi-redo"></i>
      </button>

      <button class="btn-cancel" @click="$emit('cancel')">
        {{ t('overlay.discard') }} <kbd>Esc</kbd>
      </button>
      <button class="btn-done" @click="$emit('done')">
        {{ t('common.ok', 'Done') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useI18n } from '@/composables/useI18n'

defineProps<{
  sessionName: string
  issueCount: number
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'done'): void
}>()

const overlayStore = useOverlayStore()
const { t } = useI18n()
const canUndo = computed(() => overlayStore.undoStack.length > 0)
const canRedo = computed(() => overlayStore.redoStack.length > 0)
</script>

<style scoped>
.overlay-status-bar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  height: 48px;
  min-width: 500px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(26, 29, 39, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  color: #E8E8E8;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.session-badge {
  background: rgba(255, 107, 53, 0.15);
  color: #FF6B35;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid rgba(255, 107, 53, 0.30);
}

.session-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #E8E8E8;
}

.divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
}

.issue-count {
  font-size: 0.85rem;
  color: rgba(232, 232, 232, 0.55);
}

/* Buttons */
.btn-cancel,
.btn-done {
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
  font-family: inherit;
  line-height: 1;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #E8E8E8;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-done {
  background: #FF6B35;
  color: #fff;
}

.btn-done:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-done:active {
  transform: translateY(0);
}

kbd {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-family: monospace;
  font-size: 0.72rem;
  color: rgba(232, 232, 232, 0.75);
  vertical-align: middle;
}

.btn-history {
  background: transparent;
  border: none;
  color: #E8E8E8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-history:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.btn-history:disabled {
  color: rgba(232, 232, 232, 0.25);
  cursor: not-allowed;
}

.mr-2 {
  margin-right: 8px;
}

.mr-4 {
  margin-right: 16px;
}
</style>
