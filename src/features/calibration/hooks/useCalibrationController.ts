import { useEffect, useRef, useState } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import {
  CLOSE_DISTANCE_PX,
  INITIAL_ANNOTATIONS,
  JOB_ID,
  LABELS,
  STORAGE_KEY,
} from '../../../shared/constants/calibration'
import type {
  Annotation,
  DeleteState,
  IconHoverType,
  Point,
  SavedCalibration,
  ToolMode,
  ViewTransform,
} from '../../../shared/types/calibration'
import {
  clamp,
  formatTimestamp,
  getBounds,
  makeId,
  pointInPolygon,
} from '../../../shared/utils/calibration'

export function useCalibrationController() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const draggedAnchorRef = useRef<{ annotationId: string; pointIndex: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null,
  )
  const suppressClickRef = useRef(false)
  const skipDirtyRef = useRef(true)

  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ANNOTATIONS

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_ANNOTATIONS

    try {
      const parsed = JSON.parse(raw) as { annotations?: Annotation[] }

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
  const [hoveredIcon, setHoveredIcon] = useState<{ id: string; type: IconHoverType } | null>(
    null,
  )
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
      const parsed = JSON.parse(raw) as { lastSavedAt?: string | null }

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
  const activeLabelCount = annotations.filter(
    (annotation) => annotation.labelId === activeLabel.id,
  ).length
  const drawDisabled = activeLabelCount >= activeLabel.max
  const filteredQuery = searchQuery.trim().toLowerCase()
  const selectedAnnotation =
    annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null
  const selectedBounds = selectedAnnotation ? getBounds(selectedAnnotation.points) : null
  const drawHint =
    activeLabel.shapeType === 'polygon'
      ? 'Click to place points. Click the first point to close.'
      : 'Drag corner-to-corner to create a rectangle.'

  function toNormalizedPoint(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null

    return {
      x: clamp(
        (clientX - rect.left - viewTransform.offsetX) / (rect.width * viewTransform.scale),
        0,
        1,
      ),
      y: clamp(
        (clientY - rect.top - viewTransform.offsetY) / (rect.height * viewTransform.scale),
        0,
        1,
      ),
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
        label:
          LABELS.find((label) => label.id === annotation.labelId)?.name ?? annotation.labelId,
        name: annotation.name,
        points: annotation.points.map((point) => ({
          x: Number(point.x.toFixed(4)),
          y: Number(point.y.toFixed(4)),
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
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

  function handleCanvasMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    const panStart = panStartRef.current

    if (isPanning && panStart) {
      setViewTransform((current) => ({
        ...current,
        offsetX: panStart.originX + (event.clientX - panStart.x),
        offsetY: panStart.originY + (event.clientY - panStart.y),
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

  function handleCanvasMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
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

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
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

  function handleCanvasClick(event: ReactMouseEvent<HTMLDivElement>) {
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

  function handleCanvasDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
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

      const currentSelected = annotations.find(
        (annotation) => annotation.id === selectedAnnotationId,
      )

      if (currentSelected?.labelId === deleteState.labelId) {
        setSelectedAnnotationId(null)
        setEditingAnnotationId(null)
      }
    }

    setDeleteState(null)
  }

  return {
    annotations,
    activeLabelId,
    activeLabel,
    toolMode,
    selectedAnnotationId,
    editingAnnotationId,
    hoveredAnnotationId,
    hoveredIcon,
    drawingPoints,
    pendingPoint,
    polygonCloseReady,
    rectStart,
    rectCurrent,
    deleteState,
    renameAnnotationId,
    renameValue,
    searchQuery,
    lastSavedAt,
    hasUnsavedChanges,
    saveState,
    isSpacePressed,
    isPanning,
    viewTransform,
    drawDisabled,
    filteredQuery,
    selectedBounds,
    drawHint,
    containerRef,
    renameInputRef,
    setHoveredAnnotationId,
    setHoveredIcon,
    setDeleteState,
    setRenameValue,
    setSearchQuery,
    setSelectedAnnotationId,
    setEditingAnnotationId,
    setToolMode,
    setRenameAnnotationId,
    selectLabel,
    switchTool,
    zoomBy,
    resetViewTransform,
    commitRename,
    startRename,
    toggleAnnotationVisibility,
    toggleLabelVisibility,
    saveCalibration,
    handleCanvasMouseMove,
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleCanvasMouseLeave,
    handleCanvasWheel,
    handleCanvasClick,
    handleCanvasDoubleClick,
    beginAnchorDrag,
    confirmDelete,
    formatTimestamp,
  }
}

export type CalibrationController = ReturnType<typeof useCalibrationController>
