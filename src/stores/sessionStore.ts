import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  const sortBy = ref<'newest' | 'oldest' | 'issues_desc' | 'status'>('newest')

  const sortedSessions = computed(() => {
    const list = [...sessions.value]
    if (sortBy.value === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    if (sortBy.value === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    if (sortBy.value === 'issues_desc') {
      return list.sort((a, b) => (b.issueCount || 0) - (a.issueCount || 0))
    }
    if (sortBy.value === 'status') {
      const statusOrder: Record<string, number> = { active: 0, completed: 1, archived: 2 }
      return list.sort((a, b) => {
        const orderA = statusOrder[a.status] ?? 99
        const orderB = statusOrder[b.status] ?? 99
        return orderA - orderB
      })
    }
    return list
  })

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
    sortBy,
    sortedSessions,
    fetchSessions,
    fetchSessionsByProject,
    createSession,
    updateSession,
    deleteSession,
  }
})
