import type { ToolMode } from '../../../shared/types/calibration'

type CalibrationToolbarProps = {
  toolMode: ToolMode
  activeShapeType: 'polygon' | 'rectangle'
  drawDisabled: boolean
  activeLabelName: string
  switchTool: (nextTool: ToolMode) => void
  zoomBy: (delta: number) => void
  resetViewTransform: () => void
}

export default function CalibrationToolbar({
  toolMode,
  activeShapeType,
  drawDisabled,
  activeLabelName,
  switchTool,
  zoomBy,
  resetViewTransform,
}: CalibrationToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-mode">
        <span className="toolbar-mode__label">Mode</span>
        <strong className="toolbar-mode__value">
          {toolMode === 'select'
            ? 'Select'
            : activeShapeType === 'polygon'
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
            ? `${activeLabelName} already reached its maximum region count`
            : `Draw ${activeLabelName}`
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
  )
}
