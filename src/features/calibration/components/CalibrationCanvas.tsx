import { LABELS, VIEWBOX_SIZE } from '../../../shared/constants/calibration'
import type { Annotation, Point, ToolMode, ViewTransform } from '../../../shared/types/calibration'
import { getBounds, getPolygonPath } from '../../../shared/utils/calibration'

type CalibrationCanvasProps = {
  containerRef: React.RefObject<HTMLDivElement | null>
  annotations: Annotation[]
  selectedAnnotationId: string | null
  editingAnnotationId: string | null
  hoveredAnnotationId: string | null
  drawingPoints: Point[]
  pendingPoint: Point | null
  polygonCloseReady: boolean
  rectStart: Point | null
  rectCurrent: Point | null
  selectedBounds:
    | {
        minX: number
        maxX: number
        minY: number
        maxY: number
      }
    | null
  toolMode: ToolMode
  activeLabelName: string
  drawHint: string
  isPanning: boolean
  isSpacePressed: boolean
  viewTransform: ViewTransform
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void
  beginAnchorDrag: (annotationId: string, pointIndex: number) => void
}

export default function CalibrationCanvas({
  containerRef,
  annotations,
  selectedAnnotationId,
  editingAnnotationId,
  hoveredAnnotationId,
  drawingPoints,
  pendingPoint,
  polygonCloseReady,
  rectStart,
  rectCurrent,
  selectedBounds,
  toolMode,
  activeLabelName,
  drawHint,
  isPanning,
  isSpacePressed,
  viewTransform,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onClick,
  onDoubleClick,
  onWheel,
  beginAnchorDrag,
}: CalibrationCanvasProps) {
  return (
    <div
      ref={containerRef}
      className={
        isPanning
          ? 'calibration-canvas is-panning'
          : isSpacePressed
            ? 'calibration-canvas is-pan-ready'
            : 'calibration-canvas'
      }
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
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
                        className={
                          polygonCloseReady ? 'close-anchor-ring is-ready' : 'close-anchor-ring'
                        }
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
          <strong>{activeLabelName}</strong>
          <span>{polygonCloseReady ? 'Click now to close polygon.' : drawHint}</span>
        </div>
      ) : null}
    </div>
  )
}
