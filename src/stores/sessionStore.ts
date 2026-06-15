import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Session, CreateSessionPayload, UpdateSessionPayload } from '@/types/session'
import { useUiStore } from './uiStore'
import {
  getSessions as apiGetSessions,
  getSessionsByProject as apiGetSessionsByProject,
  createSession as apiCreateSession,
  updateSession as apiUpdateSession,
  deleteSession as apiDeleteSession,
} from '@/services/tauriCommands'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<Session[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchSessions() {
    isLoading.value = true
    error.value = null
    try {
      sessions.value = await apiGetSessions()
    } catch (err: any) {
      error.value = err.message || String(err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSessionsByProject(projectId: string) {
    isLoading.value = true
    error.value = null
    try {
      sessions.value = await apiGetSessionsByProject(projectId)
    } catch (err: any) {
      error.value = err.message || String(err)
    } finally {
      isLoading.value = false
    }
  }

  async function createSession(payload: CreateSessionPayload) {
    const uiStore = useUiStore()
    uiStore.setLoading(true)
    error.value = null
    try {
      const newSession = await apiCreateSession(payload)
      sessions.value.unshift(newSession)
      uiStore.showToast({ message: `Session "${newSession.title}" created`, type: 'success' })
      return newSession
    } catch (err: any) {
      const msg = err.message || String(err)
      error.value = msg
      uiStore.showToast({ message: `Failed to create session: ${msg}`, type: 'error' })
      throw err
    } finally {
      uiStore.setLoading(false)
    }
  }

  async function updateSession(id: string, payload: UpdateSessionPayload) {
    const uiStore = useUiStore()
    uiStore.setLoading(true)
    error.value = null
    try {
      const updatedSession = await apiUpdateSession(id, payload)
      const index = sessions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sessions.value[index] = updatedSession
      }
      
      if (payload.status === 'completed') {
        uiStore.showToast({ message: `Session "${updatedSession.title}" completed`, type: 'success' })
      } else {
        uiStore.showToast({ message: `Session "${updatedSession.title}" updated`, type: 'success' })
      }
      return updatedSession
    } catch (err: any) {
      const msg = err.message || String(err)
      error.value = msg
      uiStore.showToast({ message: `Failed to update session: ${msg}`, type: 'error' })
      throw err
    } finally {
      uiStore.setLoading(false)
    }
  }

  async function deleteSession(id: string) {
    const uiStore = useUiStore()
    uiStore.setLoading(true)
    error.value = null
    try {
      const sessionTitle = sessions.value.find(s => s.id === id)?.title || ''
      await apiDeleteSession(id)
      sessions.value = sessions.value.filter(s => s.id !== id)
      uiStore.showToast({ message: `Session "${sessionTitle}" deleted`, type: 'success' })
    } catch (err: any) {
      const msg = err.message || String(err)
      error.value = msg
      uiStore.showToast({ message: `Failed to delete session: ${msg}`, type: 'error' })
      throw err
    } finally {
      uiStore.setLoading(false)
    }
  }

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    fetchSessionsByProject,
    createSession,
    updateSession,
    deleteSession,
  }
})
