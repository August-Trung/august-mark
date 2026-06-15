import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Session, CreateSessionPayload, UpdateSessionPayload } from '@/types/session'
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
    isLoading.value = true
    error.value = null
    try {
      const newSession = await apiCreateSession(payload)
      sessions.value.unshift(newSession)
      return newSession
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateSession(id: string, payload: UpdateSessionPayload) {
    isLoading.value = true
    error.value = null
    try {
      const updatedSession = await apiUpdateSession(id, payload)
      const index = sessions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sessions.value[index] = updatedSession
      }
      return updatedSession
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSession(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await apiDeleteSession(id)
      sessions.value = sessions.value.filter(s => s.id !== id)
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
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
