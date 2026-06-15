import { Annotation } from './annotation'

export type IssueType = 'Bug' | 'UI' | 'UX' | 'Suggestion' | 'Requirement' | 'Question'
export type Severity = 'Critical' | 'Major' | 'Minor' | 'Info'
export type IssueStatus = 'Draft' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Issue {
  id: string
  captureId: string
  sessionId: string
  projectId: string
  markerNumber: number
  title: string
  description: string
  issueType: IssueType
  severity: Severity
  status: IssueStatus
  markerX: number
  markerY: number
  annotationData: Annotation // Parsed Annotation object on the frontend
  color: string
  strokeWidth: number
  cropPath: string | null
  createdAt: string
  updatedAt: string
  tags?: Tag[]
}
