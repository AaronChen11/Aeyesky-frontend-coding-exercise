import { useEffect, useRef, useState } from 'react'
import './App.css'

type Point = {
  x: number
  y: number
}

type ShapeType = 'polygon' | 'rectangle'
type ToolMode = 'select' | 'draw'
type IconHoverType = 'eye' | 'delete'
type Page = 'overview' | 'calibration'

type LabelConfig = {
  id: string
  name: string
  shapeType: ShapeType
  max: number
  color: string
  description: string
}

type Annotation = {
  id: string
  labelId: string
  name: string
  points: Point[]
  visible: boolean
}

type DeleteState =
  | { type: 'annotation'; annotationId: string }
  | { type: 'label'; labelId: string }
  | null

type ViewTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

type SavedCalibration = {
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

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.4 12s3.8-6.8 9.6-6.8S21.6 12 21.6 12 17.8 18.8 12 18.8 2.4 12 2.4 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.4 4.1 20.6 19.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6.1 6.8C4 8.5 2.5 11 2.5 11s3.7 6.2 9.5 6.2c1.9 0 3.5-.5 4.9-1.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 4.9c.9-.3 1.9-.4 2.9-.4 5.8 0 9.5 6.2 9.5 6.2s-1.1 1.9-3.2 3.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4.75h6M10.1 4.75l.58-1.25h2.64l.58 1.25M6.75 7h10.5M8.35 7.35l.44 10.15h6.42l.44-10.15M10.35 9.85v5.15M13.65 9.85v5.15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PolygonShapeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4.5 19 18.5H5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RectangleShapeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const JOB_ID = 'DSH-4532'
const STORAGE_KEY = 'aeyesky-calibration-state'
const VIEWBOX_SIZE = 1000
const CLOSE_DISTANCE_PX = 14

const LABELS: LabelConfig[] = [
  {
    id: 'main_bet',
    name: 'main_bet',
    shapeType: 'polygon',
    max: 7,
    color: '#6b63ff',
    description: 'Main betting area for each seat.',
  },
  {
    id: 'chip_tray',
    name: 'chip_tray',
    shapeType: 'rectangle',
    max: 1,
    color: '#29b6f6',
    description: "Dealer's chip rack.",
  },
  {
    id: 'insurance',
    name: 'insurance',
    shapeType: 'polygon',
    max: 7,
    color: '#a855f7',
    description: 'Insurance arc or seat-level insurance region.',
  },
  {
    id: 'dealer_area',
    name: 'dealer_area',
    shapeType: 'polygon',
    max: 1,
    color: '#fb923c',
    description: 'Dealer hand / reveal area.',
  },
  {
    id: 'card_shoe',
    name: 'card_shoe',
    shapeType: 'rectangle',
    max: 1,
    color: '#34d399',
    description: 'Card shoe housing.',
  },
  {
    id: 'discard_tray',
    name: 'discard_tray',
    shapeType: 'rectangle',
    max: 1,
    color: '#fbbf24',
    description: 'Discard tray or burn card tray.',
  },
]

const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'mb-seat-1',
    labelId: 'main_bet',
    name: 'main_bet_1',
    visible: true,
    points: [
      { x: 0.244, y: 0.454 },
      { x: 0.299, y: 0.528 },
      { x: 0.274, y: 0.609 },
      { x: 0.213, y: 0.553 },
    ],
  },
  {
    id: 'mb-seat-2',
    labelId: 'main_bet',
    name: 'main_bet_2',
    visible: true,
    points: [
      { x: 0.437, y: 0.525 },
      { x: 0.533, y: 0.525 },
      { x: 0.533, y: 0.683 },
      { x: 0.438, y: 0.683 },
    ],
  },
  {
    id: 'mb-seat-3',
    labelId: 'main_bet',
    name: 'main_bet_3',
    visible: false,
    points: [
      { x: 0.688, y: 0.454 },
      { x: 0.746, y: 0.528 },
      { x: 0.724, y: 0.607 },
      { x: 0.662, y: 0.552 },
    ],
  },
  {
    id: 'chip-rack',
    labelId: 'chip_tray',
    name: 'chip_tray_1',
    visible: true,
    points: [
      { x: 0.312, y: 0.102 },
      { x: 0.646, y: 0.102 },
      { x: 0.646, y: 0.251 },
      { x: 0.312, y: 0.251 },
    ],
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `anno-${Math.random().toString(36).slice(2, 10)}`
}

function formatTimestamp(value: string | null) {
  if (!value) return 'Never saved'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Never saved' : date.toLocaleString()
}

function getPolygonPath(points: Point[]) {
  return points.map((point) => `${point.x * VIEWBOX_SIZE},${point.y * VIEWBOX_SIZE}`).join(' ')
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

function getBounds(points: Point[]) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function getPageFromHash(hash: string): Page {
  return hash === '#/calibration' ? 'calibration' : 'overview'
}

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const draggedAnchorRef = useRef<{ annotationId: string; pointIndex: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const suppressClickRef = useRef(false)
  const skipDirtyRef = useRef(true)
  const overviewAnimationFrameRef = useRef<number | null>(null)
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'overview' : getPageFromHash(window.location.hash),
  )
  const [overviewDot, setOverviewDot] = useState<Point>({ x: 0.22, y: 0.66 })

  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ANNOTATIONS

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_ANNOTATIONS

    try {
      const parsed = JSON.parse(raw) as {
        annotations?: Annotation[]
      }

      return Array.isArray(parsed.annotations) && parsed.annotations.length > 0
        ? parsed.annotations
        : INITIAL_ANNOTATIONS
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return INITIAL_ANNOTATIONS
    }
  })
  const [activeLabelId, setActiveLabelId] = useState(LABELS[0].id)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null)
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<{ id: string; type: IconHoverType } | null>(null)
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([])
  const [pendingPoint, setPendingPoint] = useState<Point | null>(null)
  const [polygonCloseReady, setPolygonCloseReady] = useState(false)
  const [rectStart, setRectStart] = useState<Point | null>(null)
  const [rectCurrent, setRectCurrent] = useState<Point | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [renameAnnotationId, setRenameAnnotationId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as {
        lastSavedAt?: string | null
      }

      return typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : null
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        annotations,
        lastSavedAt,
      }),
    )
  }, [annotations, lastSavedAt])

  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false
      return
    }
    setHasUnsavedChanges(true)
  }, [annotations])

  useEffect(() => {
    if (saveState !== 'saved') return
    const timeout = window.setTimeout(() => setSaveState('idle'), 2200)
    return () => window.clearTimeout(timeout)
  }, [saveState])

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const waypoints: Point[] = [
      { x: 0.22, y: 0.66 },
      { x: 0.63, y: 0.58 },
      { x: 0.71, y: 0.24 },
      { x: 0.38, y: 0.33 },
    ]
    const segmentDuration = 1500
    const start = performance.now()
    const ease = (value: number) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2

    const tick = (now: number) => {
      const total = waypoints.length * segmentDuration
      const elapsed = ((now - start) % total + total) % total
      const segmentIndex = Math.min(
        waypoints.length - 1,
        Math.floor(elapsed / segmentDuration),
      )
      const localProgress = ease((elapsed % segmentDuration) / segmentDuration)
      const from = waypoints[segmentIndex]
      const to = waypoints[(segmentIndex + 1) % waypoints.length]

      setOverviewDot({
        x: from.x + (to.x - from.x) * localProgress,
        y: from.y + (to.y - from.y) * localProgress,
      })

      overviewAnimationFrameRef.current = requestAnimationFrame(tick)
    }

    overviewAnimationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (overviewAnimationFrameRef.current) {
        cancelAnimationFrame(overviewAnimationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (renameAnnotationId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renameAnnotationId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'Space') {
        setIsSpacePressed(true)
      }

      if (event.key === 'Escape') {
        draggedAnchorRef.current = null
        panStartRef.current = null
        setIsPanning(false)
        setDrawingPoints([])
        setPendingPoint(null)
        setRectStart(null)
        setRectCurrent(null)
        setEditingAnnotationId(null)
        setRenameAnnotationId(null)
        setDeleteState(null)
        setToolMode('select')
      }

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        selectedAnnotationId &&
        !renameAnnotationId
      ) {
        setDeleteState({ type: 'annotation', annotationId: selectedAnnotationId })
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [renameAnnotationId, selectedAnnotationId])

  const activeLabel = LABELS.find((label) => label.id === activeLabelId) ?? LABELS[0]
  const activeLabelCount = annotations.filter((annotation) => annotation.labelId === activeLabel.id).length
  const drawDisabled = activeLabelCount >= activeLabel.max

  function toNormalizedPoint(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null

    return {
      x: clamp((clientX - rect.left - viewTransform.offsetX) / (rect.width * viewTransform.scale), 0, 1),
      y: clamp((clientY - rect.top - viewTransform.offsetY) / (rect.height * viewTransform.scale), 0, 1),
    }
  }

  function resetViewTransform() {
    setViewTransform({ scale: 1, offsetX: 0, offsetY: 0 })
  }

  function zoomBy(delta: number) {
    const nextScale = clamp(Number((viewTransform.scale + delta).toFixed(2)), 1, 2.5)
    if (nextScale === 1) {
      resetViewTransform()
      return
    }
    setViewTransform((current) => ({ ...current, scale: nextScale }))
  }

  function selectLabel(labelId: string) {
    setActiveLabelId(labelId)
    setToolMode('select')
    setDrawingPoints([])
    setPendingPoint(null)
    setPolygonCloseReady(false)
    setRectStart(null)
    setRectCurrent(null)
    setEditingAnnotationId(null)
    setSelectedAnnotationId(null)
  }

  function switchTool(nextTool: ToolMode) {
    if (nextTool === 'draw' && drawDisabled) return

    setToolMode(nextTool)
    setDrawingPoints([])
    setPendingPoint(null)
    setPolygonCloseReady(false)
    setRectStart(null)
    setRectCurrent(null)
    setEditingAnnotationId(null)
    setRenameAnnotationId(null)
  }

  function commitRename() {
    if (!renameAnnotationId) return

    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === renameAnnotationId
          ? { ...annotation, name: renameValue.trim() || annotation.id }
          : annotation,
      ),
    )
    setRenameAnnotationId(null)
    setRenameValue('')
  }

  function startRename(annotation: Annotation) {
    setRenameAnnotationId(annotation.id)
    setRenameValue(annotation.name)
  }

  function toggleAnnotationVisibility(annotationId: string) {
    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === annotationId
          ? { ...annotation, visible: !annotation.visible }
          : annotation,
      ),
    )
  }

  function toggleLabelVisibility(labelId: string) {
    const labelAnnotations = annotations.filter((annotation) => annotation.labelId === labelId)
    const shouldHide = labelAnnotations.every((annotation) => annotation.visible)

    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.labelId === labelId
          ? { ...annotation, visible: !shouldHide }
          : annotation,
      ),
    )
  }

  function hitTest(point: Point) {
    const visibleAnnotations = [...annotations].reverse()
    return (
      visibleAnnotations.find(
        (annotation) => annotation.visible && pointInPolygon(point, annotation.points),
      ) ?? null
    )
  }

  function finishRectangle() {
    if (!rectStart || !rectCurrent) return

    const minX = Math.min(rectStart.x, rectCurrent.x)
    const maxX = Math.max(rectStart.x, rectCurrent.x)
    const minY = Math.min(rectStart.y, rectCurrent.y)
    const maxY = Math.max(rectStart.y, rectCurrent.y)

    setRectStart(null)
    setRectCurrent(null)

    if (maxX - minX < 0.01 || maxY - minY < 0.01) return

    const nextAnnotation: Annotation = {
      id: makeId(),
      labelId: activeLabel.id,
      name: `${activeLabel.name}_${activeLabelCount + 1}`,
      visible: true,
      points: [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ],
    }

    setAnnotations((current) => [...current, nextAnnotation])
    setSelectedAnnotationId(nextAnnotation.id)
    setEditingAnnotationId(null)
    setToolMode('select')
    setPolygonCloseReady(false)
  }

  function saveCalibration() {
    const payload: SavedCalibration = {
      jobId: JOB_ID,
      coordinateFormat: {
        unit: 'normalized',
        origin: 'top-left',
        axes: { x: 'left-to-right', y: 'top-to-bottom' },
        schema: 'points[]',
        pointExample: { x: 0.3482, y: 0.5871 },
      },
      savedAt: new Date().toISOString(),
      areas: annotations.map((annotation) => ({
        id: annotation.id,
        label: LABELS.find((label) => label.id === annotation.labelId)?.name ?? annotation.labelId,
        name: annotation.name,
        points: annotation.points.map((point) => ({
          x: Number(point.x.toFixed(4)),
          y: Number(point.y.toFixed(4)),
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `calibration-${JOB_ID}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setLastSavedAt(payload.savedAt)
    setHasUnsavedChanges(false)
    setSaveState('saved')
  }

  function handleCanvasMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (isPanning && panStartRef.current) {
      setViewTransform((current) => ({
        ...current,
        offsetX: panStartRef.current!.originX + (event.clientX - panStartRef.current!.x),
        offsetY: panStartRef.current!.originY + (event.clientY - panStartRef.current!.y),
      }))
      return
    }

    const point = toNormalizedPoint(event.clientX, event.clientY)
    if (!point) return

    setPendingPoint(point)
    if (toolMode === 'draw' && activeLabel.shapeType === 'polygon' && drawingPoints.length >= 3) {
      const firstPoint = drawingPoints[0]
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const dx = (point.x - firstPoint.x) * rect.width
        const dy = (point.y - firstPoint.y) * rect.height
        setPolygonCloseReady(Math.sqrt(dx * dx + dy * dy) <= CLOSE_DISTANCE_PX)
      }
    } else {
      setPolygonCloseReady(false)
    }

    if (toolMode === 'select' && !draggedAnchorRef.current) {
      const hovered = hitTest(point)
      setHoveredAnnotationId(hovered?.id ?? null)
    }

    if (rectStart) {
      setRectCurrent(point)
    }

    if (draggedAnchorRef.current) {
      suppressClickRef.current = true
      setAnnotations((current) =>
        current.map((annotation) => {
          if (annotation.id !== draggedAnchorRef.current?.annotationId) return annotation

          return {
            ...annotation,
            points: annotation.points.map((currentPoint, index) =>
              index === draggedAnchorRef.current?.pointIndex ? point : currentPoint,
            ),
          }
        }),
      )
    }
  }

  function handleCanvasMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (toolMode === 'select' && isSpacePressed) {
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        originX: viewTransform.offsetX,
        originY: viewTransform.offsetY,
      }
      setIsPanning(true)
      return
    }

    if (toolMode !== 'draw' || activeLabel.shapeType !== 'rectangle' || drawDisabled) return
    const point = toNormalizedPoint(event.clientX, event.clientY)
    if (!point) return

    setRectStart(point)
    setRectCurrent(point)
    setSelectedAnnotationId(null)
  }

  function handleCanvasMouseUp() {
    if (isPanning) {
      panStartRef.current = null
      setIsPanning(false)
      return
    }

    if (draggedAnchorRef.current) {
      draggedAnchorRef.current = null
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
      return
    }

    if (toolMode === 'draw' && activeLabel.shapeType === 'rectangle') {
      finishRectangle()
    }
  }

  function handleCanvasMouseLeave() {
    setPendingPoint(null)
    setPolygonCloseReady(false)
    setHoveredAnnotationId(null)
    panStartRef.current = null
    setIsPanning(false)
    if (draggedAnchorRef.current) {
      draggedAnchorRef.current = null
      suppressClickRef.current = false
    }
  }

  function handleCanvasWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.metaKey && !event.ctrlKey) return
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.1 : -0.1
    const nextScale = clamp(Number((viewTransform.scale + delta).toFixed(2)), 1, 2.5)
    if (nextScale === 1) {
      resetViewTransform()
      return
    }
    setViewTransform((current) => ({ ...current, scale: nextScale }))
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    const point = toNormalizedPoint(event.clientX, event.clientY)
    if (!point) return

    if (toolMode === 'draw' && activeLabel.shapeType === 'polygon') {
      if (drawDisabled) return

      if (drawingPoints.length >= 3) {
        const firstPoint = drawingPoints[0]
        const rect = containerRef.current?.getBoundingClientRect()

        if (rect) {
          const dx = (point.x - firstPoint.x) * rect.width
          const dy = (point.y - firstPoint.y) * rect.height
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance <= CLOSE_DISTANCE_PX) {
            const nextAnnotation: Annotation = {
              id: makeId(),
              labelId: activeLabel.id,
              name: `${activeLabel.name}_${activeLabelCount + 1}`,
              visible: true,
              points: drawingPoints,
            }

            setAnnotations((current) => [...current, nextAnnotation])
            setDrawingPoints([])
            setPendingPoint(null)
            setPolygonCloseReady(false)
            setSelectedAnnotationId(nextAnnotation.id)
            setToolMode('select')
            return
          }
        }
      }

      setDrawingPoints((current) => [...current, point])
      setPolygonCloseReady(false)
      return
    }

    if (toolMode === 'select') {
      const hit = hitTest(point)
      setSelectedAnnotationId(hit?.id ?? null)
      if (!hit) setEditingAnnotationId(null)
    }
  }

  function handleCanvasDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (toolMode !== 'select') return
    const point = toNormalizedPoint(event.clientX, event.clientY)
    if (!point) return

    const hit = hitTest(point)
    if (!hit) return

    setSelectedAnnotationId(hit.id)
    setEditingAnnotationId(hit.id)
  }

  function beginAnchorDrag(annotationId: string, pointIndex: number) {
    draggedAnchorRef.current = { annotationId, pointIndex }
    setEditingAnnotationId(annotationId)
    setSelectedAnnotationId(annotationId)
  }

  function confirmDelete() {
    if (!deleteState) return

    if (deleteState.type === 'annotation') {
      setAnnotations((current) =>
        current.filter((annotation) => annotation.id !== deleteState.annotationId),
      )

      if (selectedAnnotationId === deleteState.annotationId) {
        setSelectedAnnotationId(null)
        setEditingAnnotationId(null)
      }
    }

    if (deleteState.type === 'label') {
      setAnnotations((current) =>
        current.filter((annotation) => annotation.labelId !== deleteState.labelId),
      )

      const selectedAnnotation = annotations.find(
        (annotation) => annotation.id === selectedAnnotationId,
      )

      if (selectedAnnotation?.labelId === deleteState.labelId) {
        setSelectedAnnotationId(null)
        setEditingAnnotationId(null)
      }
    }

    setDeleteState(null)
  }

  const filteredQuery = searchQuery.trim().toLowerCase()

  const selectedAnnotation =
    annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null

  const selectedBounds = selectedAnnotation ? getBounds(selectedAnnotation.points) : null

  const drawHint =
    activeLabel.shapeType === 'polygon'
      ? 'Click to place points. Click the first point to close.'
      : 'Drag corner-to-corner to create a rectangle.'

  const assumptions = [
    'No backend: Save Calibration downloads a JSON file; a real integration would POST the same payload.',
    'Rectangles are stored as 4-point polygons for a uniform schema across all label shapes.',
    'The count next to a label is instances drawn vs. its max allowed.',
    "A region's generated id is permanent; its display name is separately renamable from the Labelled Area list.",
    'Anchor-edit mode supports dragging individual points to reshape a shape.',
    'Deleting a label group removes every drawn instance of that label after one confirmation.',
  ]

  if (page === 'overview') {
    return (
      <main className="overview-shell">
        <div className="overview-page">
          <header className="overview-nav">
            <a className="overview-nav__brand" href="#/overview" aria-label="Aeyesky home">
              <span>Aeyesky</span>
            </a>
            <div className="overview-nav__links">
              <a href="#how-it-works">How it works</a>
              <a href="#taxonomy">Regions</a>
              <a href="#data-format">Data format</a>
              <a className="overview-nav__cta" href="#/calibration">
                Open Calibration Tool
              </a>
            </div>
          </header>

          <section className="overview-hero">
            <div className="overview-hero__glow" />
            <div className="overview-copy overview-rise">
              <div className="overview-copy__eyebrow">Camera Calibration Tool</div>
              <h1>Teach every table camera where to look.</h1>
              <p>
                Aeyesky&apos;s vision models need to know exactly where the betting spots, chip trays
                and card shoe sit in frame. This tool lets an operator draw and label those regions
                directly on a still from the table camera.
              </p>
              <div className="overview-copy__actions">
                <a className="overview-btn overview-btn--light" href="#/calibration">
                  Launch Calibration Tool →
                </a>
                <a className="overview-btn overview-btn--ghost" href="#how-it-works">
                  See how it works
                </a>
              </div>
            </div>

            <div className="overview-preview overview-rise">
              <div className="overview-preview__pattern" />
              <div className="overview-preview__scanline" />
              <svg viewBox="0 0 400 286" className="overview-preview__svg">
                <rect
                  x="252"
                  y="46"
                  width="96"
                  height="58"
                  className="preview-rect-fill"
                />
                <rect
                  x="252"
                  y="46"
                  width="96"
                  height="58"
                  pathLength="100"
                  className="preview-rect-stroke"
                />
                <polygon
                  points="46,190 108,168 122,222 58,238"
                  className="preview-poly-fill"
                />
                <path
                  d="M46,190 L108,168 L122,222 L58,238 Z"
                  pathLength="100"
                  className="preview-poly-stroke"
                />
                <circle cx="252" cy="46" r="5" className="preview-dot preview-dot--1" />
                <circle cx="348" cy="46" r="5" className="preview-dot preview-dot--1" />
                <circle cx="348" cy="104" r="5" className="preview-dot preview-dot--2" />
                <circle cx="252" cy="104" r="5" className="preview-dot preview-dot--2" />
                <circle cx="108" cy="168" r="5" className="preview-dot preview-dot--3" />
                <circle cx="46" cy="190" r="5" className="preview-dot preview-dot--4" />
                <circle cx="122" cy="222" r="5" className="preview-dot preview-dot--5" />
                <circle cx="58" cy="238" r="5" className="preview-dot preview-dot--6" />
              </svg>
              <div className="overview-preview__job">{JOB_ID}</div>
              <div className="overview-preview__status">
                <span className="overview-preview__status-dot" />
                live calibration preview
              </div>
            </div>
          </section>

          <section className="overview-section" id="how-it-works">
            <h2>How calibration works</h2>
            <p className="overview-section__sub">Three steps, matching the actual tool UI.</p>
            <div className="overview-cards overview-cards--three">
              <article className="overview-card">
                <div className="overview-card__index">01</div>
                <h3>Pick a label</h3>
                <p>
                  Choose which region you&apos;re about to draw from the LABEL list. Its shape and max
                  instance count come from the label.
                </p>
                <div className="overview-progress">
                  <span className="overview-progress__bar is-active" />
                  <span className="overview-progress__bar" />
                  <span className="overview-progress__bar" />
                </div>
              </article>
              <article className="overview-card">
                <div className="overview-card__index">02</div>
                <h3>Draw the region</h3>
                <p>
                  Polygons use anchor clicks and close on the starting point. Rectangles are
                  corner-to-corner drags. Double-click enters anchor edit mode.
                </p>
                <svg viewBox="0 0 200 40" className="workflow-line-demo" aria-hidden="true">
                  <polyline
                    points="10,32 60,12 130,18 170,30"
                    pathLength="100"
                    className="workflow-line-demo__path"
                  />
                  <circle cx="10" cy="32" r="3.5" className="workflow-line-demo__fixed-dot" />
                  <circle cx="60" cy="12" r="3" className="workflow-line-demo__dot dot-1" />
                  <circle cx="130" cy="18" r="3" className="workflow-line-demo__dot dot-2" />
                  <circle cx="170" cy="30" r="3.5" className="workflow-line-demo__fixed-dot dot-3" />
                </svg>
              </article>
              <article className="overview-card">
                <div className="overview-card__index">03</div>
                <h3>Save calibration</h3>
                <p>
                  Rename, hide, or delete regions from the Labelled Area list, then export a JSON
                  file with id, label, and polygon coordinates.
                </p>
                <div className="save-preview">
                  <div className="save-preview__icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 2h9l5 5v15H6z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <div className="save-preview__meta">
                    <div>calibration-{JOB_ID}.json</div>
                    <div>3 regions · saved just now</div>
                  </div>
                  <div className="save-preview__pulse">
                    <span className="save-preview__pulse-ring" />
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="overview-section" id="taxonomy">
            <h2>Region taxonomy</h2>
            <p className="overview-section__sub">
              Assumed label set for a standard blackjack table. Adjustable per game type.
            </p>
            <div className="taxonomy-table">
              <div className="taxonomy-table__head">
                <div>Label</div>
                <div>Shape · max</div>
                <div>Purpose</div>
              </div>
              {LABELS.map((label) => (
                <div key={label.id} className="taxonomy-table__row">
                  <div className="taxonomy-label">
                    <span
                      className="taxonomy-label__dot"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>
                  <div>
                    {label.shapeType === 'rectangle' ? 'Rect' : 'Poly'} ·{' '}
                    {label.max === 1 ? '×1' : `up to ×${label.max}`}
                  </div>
                  <div>{label.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="overview-section" id="data-format">
            <h2>Data format &amp; assumptions</h2>
            <p className="overview-section__sub">
              Documented for the reviewer, since parts of the assignment were intentionally
              open-ended.
            </p>
            <div className="overview-data-grid">
              <div>
                <h3>Coordinate format</h3>
                <p className="overview-data-copy">
                  Each polygon point is stored as <code>{'{x, y}'}</code>, normalized 0–1 as a
                  fraction of the image container&apos;s rendered width and height, origin at the
                  top-left.
                </p>
                <div className="coord-demo">
                  <div className="coord-demo__grid">
                    <span
                      className="coord-demo__dot"
                      style={{
                        left: `${(overviewDot.x * 100).toFixed(1)}%`,
                        top: `${(overviewDot.y * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                  <div className="coord-demo__meta">
                    <span>x: {overviewDot.x.toFixed(2)}</span>
                    <span>y: {overviewDot.y.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3>Assumptions made</h3>
                <div className="assumption-stack">
                  {assumptions.map((assumption) => (
                    <div key={assumption} className="assumption-stack__item">
                      <span className="assumption-stack__dot" />
                      <span>{assumption}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="overview-footer-cta">
              <a className="overview-nav__cta" href="#/calibration">
                Open the Calibration Tool →
              </a>
            </div>
          </section>

          <footer className="overview-footer">
            Aeyesky — Frontend Coding Exercise Prototype
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="canvas-panel">
          <div className="canvas-panel__header">
            <div className="canvas-panel__header-copy">
              <a className="canvas-panel__back" href="#/overview">
                ← Back to Overview
              </a>
              <h2>{JOB_ID}</h2>
            </div>
          </div>

          <div
            ref={containerRef}
            className={isPanning ? 'calibration-canvas is-panning' : isSpacePressed ? 'calibration-canvas is-pan-ready' : 'calibration-canvas'}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onWheel={handleCanvasWheel}
          >
            <div
              className="calibration-stage"
              style={{
                transform: `translate(${viewTransform.offsetX}px, ${viewTransform.offsetY}px) scale(${viewTransform.scale})`,
              }}
            >
              <img
                className="calibration-canvas__image"
                src="/calibration-table.png"
                alt="Blackjack table reference"
              />

              <svg
                className="calibration-canvas__svg"
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                preserveAspectRatio="none"
              >
                {annotations.map((annotation) => {
                  const label = LABELS.find((item) => item.id === annotation.labelId)
                  const isSelected = annotation.id === selectedAnnotationId
                  const isEditing = annotation.id === editingAnnotationId
                  const isHovered = annotation.id === hoveredAnnotationId
                  const bounds = getBounds(annotation.points)

                  if (!annotation.visible) return null

                  return (
                    <g key={annotation.id}>
                      <polygon
                        points={getPolygonPath(annotation.points)}
                        fill={label?.color ?? '#6b63ff'}
                        fillOpacity={isSelected || isEditing ? 0.28 : isHovered ? 0.22 : 0.16}
                        stroke={label?.color ?? '#6b63ff'}
                        strokeWidth={isSelected || isEditing ? 2.8 : isHovered ? 2.4 : 2}
                        vectorEffect="non-scaling-stroke"
                      />

                      {(isSelected || isHovered) && !isEditing ? (
                        <rect
                          x={bounds.minX * VIEWBOX_SIZE}
                          y={bounds.minY * VIEWBOX_SIZE}
                          width={(bounds.maxX - bounds.minX) * VIEWBOX_SIZE}
                          height={(bounds.maxY - bounds.minY) * VIEWBOX_SIZE}
                          fill="none"
                          stroke="#9a6dff"
                          strokeWidth="1.8"
                          strokeDasharray="7 5"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : null}

                      {isEditing ? (
                        <>
                          <rect
                            x={bounds.minX * VIEWBOX_SIZE}
                            y={bounds.minY * VIEWBOX_SIZE}
                            width={(bounds.maxX - bounds.minX) * VIEWBOX_SIZE}
                            height={(bounds.maxY - bounds.minY) * VIEWBOX_SIZE}
                            fill="none"
                            stroke="#8a5dff"
                            strokeWidth="1.5"
                            strokeDasharray="6 4"
                            vectorEffect="non-scaling-stroke"
                          />
                          {annotation.points.map((point, index) => {
                            const isLast = index === annotation.points.length - 1
                            return (
                              <circle
                                key={`${annotation.id}-${index}`}
                                cx={point.x * VIEWBOX_SIZE}
                                cy={point.y * VIEWBOX_SIZE}
                                r="6.5"
                                fill={isLast ? '#5660ff' : '#ffffff'}
                                stroke="#5660ff"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                                className="anchor-point"
                                onMouseDown={(event) => {
                                  event.stopPropagation()
                                  beginAnchorDrag(annotation.id, index)
                                }}
                              />
                            )
                          })}
                        </>
                      ) : null}
                    </g>
                  )
                })}

                {rectStart && rectCurrent ? (
                  <rect
                    x={Math.min(rectStart.x, rectCurrent.x) * VIEWBOX_SIZE}
                    y={Math.min(rectStart.y, rectCurrent.y) * VIEWBOX_SIZE}
                    width={Math.abs(rectCurrent.x - rectStart.x) * VIEWBOX_SIZE}
                    height={Math.abs(rectCurrent.y - rectStart.y) * VIEWBOX_SIZE}
                    fill="rgba(107, 99, 255, 0.14)"
                    stroke="#6b63ff"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}

                {drawingPoints.length > 0 ? (
                  <>
                    <polyline
                      points={getPolygonPath(drawingPoints)}
                      fill="none"
                      stroke="#5660ff"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    {pendingPoint ? (
                      <line
                        x1={drawingPoints[drawingPoints.length - 1].x * VIEWBOX_SIZE}
                        y1={drawingPoints[drawingPoints.length - 1].y * VIEWBOX_SIZE}
                        x2={pendingPoint.x * VIEWBOX_SIZE}
                        y2={pendingPoint.y * VIEWBOX_SIZE}
                        stroke="#8bb1ff"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                    {drawingPoints.map((point, index) => {
                      const isLast = index === drawingPoints.length - 1
                      const isFirst = index === 0

                      return (
                        <g key={`draft-${index}`}>
                          {isFirst ? (
                            <circle
                              cx={point.x * VIEWBOX_SIZE}
                              cy={point.y * VIEWBOX_SIZE}
                              r={polygonCloseReady ? '14' : '10'}
                              className={polygonCloseReady ? 'close-anchor-ring is-ready' : 'close-anchor-ring'}
                            />
                          ) : null}
                          <circle
                            cx={point.x * VIEWBOX_SIZE}
                            cy={point.y * VIEWBOX_SIZE}
                            r="6.5"
                            fill={isLast ? '#5660ff' : '#ffffff'}
                            stroke="#5660ff"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </g>
                      )
                    })}
                  </>
                ) : null}
              </svg>
            </div>

            {selectedBounds ? (
              <div
                className="dimension-badge"
                style={{
                  left: `${selectedBounds.minX * 100}%`,
                  top: `calc(${selectedBounds.minY * 100}% - 28px)`,
                }}
              >
                {Math.round((selectedBounds.maxX - selectedBounds.minX) * 1000)}w ×{' '}
                {Math.round((selectedBounds.maxY - selectedBounds.minY) * 1000)}h
              </div>
            ) : null}

            {toolMode === 'draw' ? (
              <div className={polygonCloseReady ? 'draw-hint is-ready' : 'draw-hint'}>
                <strong>{activeLabel.name}</strong>
                <span>{polygonCloseReady ? 'Click now to close polygon.' : drawHint}</span>
              </div>
            ) : null}
          </div>

          <div className="toolbar">
            <div className="toolbar-mode">
              <span className="toolbar-mode__label">Mode</span>
              <strong className="toolbar-mode__value">
                {toolMode === 'select'
                  ? 'Select'
                  : activeLabel.shapeType === 'polygon'
                    ? 'Draw Polygon'
                    : 'Draw Rectangle'}
              </strong>
            </div>
            <button
              type="button"
              className={toolMode === 'select' ? 'toolbar-btn is-active' : 'toolbar-btn'}
              onClick={() => switchTool('select')}
              aria-label="Select tool"
            >
              <span className="toolbar-btn__icon">⌖</span>
              <span className="toolbar-btn__text">Select</span>
            </button>
            <button
              type="button"
              className={toolMode === 'draw' ? 'toolbar-btn is-active' : 'toolbar-btn'}
              onClick={() => switchTool('draw')}
              disabled={drawDisabled}
              aria-label="Draw tool"
              title={
                drawDisabled
                  ? `${activeLabel.name} already reached ${activeLabel.max} region(s)`
                  : `Draw ${activeLabel.name}`
              }
            >
              <span className="toolbar-btn__icon">✎</span>
              <span className="toolbar-btn__text">Draw</span>
            </button>
            <button type="button" className="toolbar-btn toolbar-btn--zoom" onClick={() => zoomBy(0.1)}>
              <span className="toolbar-btn__icon">+</span>
              <span className="toolbar-btn__text">In</span>
            </button>
            <button type="button" className="toolbar-btn toolbar-btn--zoom" onClick={() => zoomBy(-0.1)}>
              <span className="toolbar-btn__icon">−</span>
              <span className="toolbar-btn__text">Out</span>
            </button>
            <button type="button" className="toolbar-btn toolbar-btn--zoom" onClick={resetViewTransform}>
              <span className="toolbar-btn__icon">⟲</span>
              <span className="toolbar-btn__text">Reset</span>
            </button>
          </div>
        </div>

        <aside className="sidebar">
          <section className="sidebar-section">
            <div className="sidebar-section__title">Label</div>
            <div className="label-list">
              {LABELS.map((label) => {
                const count = annotations.filter((annotation) => annotation.labelId === label.id).length
                const isActive = label.id === activeLabelId
                const isAtLimit = count >= label.max
                const hasStatusDot = count > 0
                const statusDotClass = isAtLimit
                  ? 'label-row__status-dot is-complete'
                  : 'label-row__status-dot is-partial'

                return (
                  <button
                    key={label.id}
                    type="button"
                    className={isActive ? 'label-row is-active' : 'label-row'}
                    onClick={() => selectLabel(label.id)}
                  >
                    <span
                      className="label-row__bar"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="label-row__shape-icon">
                      {label.shapeType === 'polygon' ? <PolygonShapeIcon /> : <RectangleShapeIcon />}
                    </span>
                    <span className="label-row__content">
                      <span className="label-row__name">{label.name}</span>
                      <span className="label-row__description">{label.description}</span>
                    </span>
                    <span className="label-row__status">
                      {hasStatusDot ? <span className={statusDotClass} /> : <span className="label-row__status-dot is-empty" />}
                      <span className={isAtLimit ? 'label-row__count is-at-limit' : 'label-row__count'}>
                        {count}/{label.max}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="sidebar-section sidebar-section--grow">
            <div className="sidebar-section__title">Labelled Area</div>
            <div className="search-wrap">
              <input
                className="search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search All"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            <div className="annotation-groups">
              {LABELS.map((label) => {
                const labelAnnotations = annotations.filter(
                  (annotation) =>
                    annotation.labelId === label.id &&
                    (!filteredQuery ||
                      label.name.toLowerCase().includes(filteredQuery) ||
                      annotation.name.toLowerCase().includes(filteredQuery)),
                )

                if (labelAnnotations.length === 0 && filteredQuery) return null

                const labelVisible =
                  labelAnnotations.length === 0 ||
                  labelAnnotations.every((annotation) => annotation.visible)

                return (
                  <div key={label.id} className="annotation-group">
                    <div className="annotation-group__header">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => toggleLabelVisibility(label.id)}
                      >
                        {labelVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </button>
                      <span
                        className="annotation-group__bar"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="annotation-group__name-wrap">
                        <span className="annotation-group__name">{label.name}</span>
                      </span>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => setDeleteState({ type: 'label', labelId: label.id })}
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    {labelAnnotations.map((annotation, index) => {
                        const isSelected = annotation.id === selectedAnnotationId
                        const isRenaming = annotation.id === renameAnnotationId
                        const iconState = hoveredIcon?.id === annotation.id ? hoveredIcon.type : null
                        const isHidden = !annotation.visible

                      return (
                        <div
                          key={annotation.id}
                          className={
                            hoveredAnnotationId === annotation.id
                              ? isSelected
                                ? isHidden
                                  ? 'annotation-row is-selected is-hovered is-hidden'
                                  : 'annotation-row is-selected is-hovered'
                                : isHidden
                                  ? 'annotation-row is-hovered is-hidden'
                                  : 'annotation-row is-hovered'
                              : isSelected
                                ? isHidden
                                  ? 'annotation-row is-selected is-hidden'
                                  : 'annotation-row is-selected'
                                : isHidden
                                  ? 'annotation-row is-hidden'
                                  : 'annotation-row'
                          }
                          onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
                          onMouseLeave={() => setHoveredAnnotationId(null)}
                          onClick={() => {
                            setSelectedAnnotationId(annotation.id)
                            setEditingAnnotationId(null)
                            setToolMode('select')
                          }}
                        >
                          <button
                            type="button"
                            className={
                              iconState === 'eye'
                                ? 'icon-btn icon-btn--eye is-hot'
                                : 'icon-btn icon-btn--eye'
                            }
                            onMouseEnter={() =>
                              setHoveredIcon({ id: annotation.id, type: 'eye' })
                            }
                            onMouseLeave={() => setHoveredIcon(null)}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleAnnotationVisibility(annotation.id)
                            }}
                          >
                            {annotation.visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                          </button>
                          <span className="annotation-row__bar-spacer" aria-hidden="true" />
                          <span
                            className="annotation-row__index"
                            style={{ backgroundColor: isSelected ? '#6b63ff' : '#eef2f7', color: isSelected ? '#ffffff' : '#5f6b7a' }}
                          >
                            {index + 1}
                          </span>
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              className="rename-input"
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') commitRename()
                                if (event.key === 'Escape') {
                                  setRenameAnnotationId(null)
                                  setRenameValue('')
                                }
                              }}
                              onClick={(event) => event.stopPropagation()}
                            />
                          ) : (
                            <button
                              type="button"
                              className={
                                annotation.visible
                                  ? 'annotation-row__name'
                                  : 'annotation-row__name is-muted'
                              }
                              onDoubleClick={(event) => {
                                event.stopPropagation()
                                startRename(annotation)
                              }}
                            >
                              {annotation.name}
                            </button>
                          )}
                          <button
                            type="button"
                            className={
                              iconState === 'delete'
                                ? 'icon-btn icon-btn--danger is-hot'
                                : 'icon-btn icon-btn--danger'
                            }
                            onMouseEnter={() =>
                              setHoveredIcon({ id: annotation.id, type: 'delete' })
                            }
                            onMouseLeave={() => setHoveredIcon(null)}
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteState({
                                type: 'annotation',
                                annotationId: annotation.id,
                              })
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="sidebar-section sidebar-section--footer">
            <div className="save-meta">
              <span>{hasUnsavedChanges ? 'Status' : 'Last Save'}</span>
              <strong>
                {saveState === 'saved'
                  ? 'Saved just now'
                  : hasUnsavedChanges
                    ? 'Unsaved changes'
                    : formatTimestamp(lastSavedAt)}
              </strong>
            </div>
            <button type="button" className="save-btn" onClick={saveCalibration}>
              {saveState === 'saved' ? 'Calibration Saved' : 'Save Calibration'}
            </button>
            <p className="coordinate-note">
              Coordinates are saved as normalized polygons: each point is{' '}
              <code>{'{ x, y }'}</code> in the range <code>0–1</code>, measured from the top-left
              corner of the image.
            </p>
          </section>
        </aside>
      </section>

      {deleteState ? (
        <div className="modal-backdrop" onClick={() => setDeleteState(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <p className="modal__eyebrow">Delete labeled area</p>
            <h3>
              {deleteState.type === 'annotation'
                ? 'Delete this annotation?'
                : 'Delete all annotations for this label?'}
            </h3>
            <p className="modal__copy">
              {deleteState.type === 'annotation'
                ? 'This removes the selected polygon from the canvas and the list.'
                : 'This removes every region currently assigned to that label.'}
            </p>
            <div className="modal__actions">
              <button type="button" className="modal-btn" onClick={() => setDeleteState(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn--danger"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {saveState === 'saved' ? (
        <div className="save-toast" role="status" aria-live="polite">
          Calibration JSON exported successfully.
        </div>
      ) : null}
    </main>
  )
}

export default App
