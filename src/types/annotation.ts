export interface Point {
  x: number
  y: number
}

export type AnnotationType = 'marker' | 'rect' | 'arrow' | 'freedraw' | 'text' | 'highlight' | 'blur'

export interface BaseAnnotation {
  id: string
  type: AnnotationType
  color: string
  strokeWidth: number
  number: number
  issue?: {
    title: string
    issueType: string
    severity: string
    description: string
  }
}

export interface MarkerAnnotation extends BaseAnnotation {
  type: 'marker'
  position: Point
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect'
  topLeft: Point
  width: number
  height: number
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow'
  start: Point
  end: Point
}

export interface FreeDrawAnnotation extends BaseAnnotation {
  type: 'freedraw'
  points: Point[]
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  position: Point
  text: string
  fontSize: number
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight'
  topLeft: Point
  width: number
  height: number
  opacity: number  // 0.3 default
}

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur'
  topLeft: Point
  width: number
  height: number
  blurRadius: number  // pixels
}

export type Annotation =
  | MarkerAnnotation
  | RectAnnotation
  | ArrowAnnotation
  | FreeDrawAnnotation
  | TextAnnotation
  | HighlightAnnotation
  | BlurAnnotation
