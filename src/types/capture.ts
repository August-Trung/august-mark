export interface Capture {
  id: string
  sessionId: string
  screenshotPath: string
  monitorName: string
  monitorWidth: number
  monitorHeight: number
  scaleFactor: number
  windowTitle: string | null
  createdAt: string
}

export interface MonitorInfo {
  x: number
  y: number
  width: number
  height: number
  scaleFactor: number
  name: string
}
