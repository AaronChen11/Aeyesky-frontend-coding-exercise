export type Point = {
  x: number
  y: number
}

export type ShapeType = 'polygon' | 'rectangle'
export type ToolMode = 'select' | 'draw'
export type IconHoverType = 'eye' | 'delete'
export type Page = 'overview' | 'calibration'

export type LabelConfig = {
  id: string
  name: string
  shapeType: ShapeType
  max: number
  color: string
  description: string
}

export type Annotation = {
  id: string
  labelId: string
  name: string
  points: Point[]
  visible: boolean
}

export type DeleteState =
  | { type: 'annotation'; annotationId: string }
  | { type: 'label'; labelId: string }
  | null

export type ViewTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

export type SavedCalibration = {
  jobId: string
  coordinateFormat: {
    unit: 'normalized'
    origin: 'top-left'
    axes: { x: 'left-to-right'; y: 'top-to-bottom' }
    schema: 'points[]'
    pointExample: { x: number; y: number }
  }
  savedAt: string
  areas: Array<{
    id: string
    label: string
    name: string
    points: Point[]
  }>
}
