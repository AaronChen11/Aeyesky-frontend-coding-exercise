import { JOB_ID } from '../../shared/constants/calibration'
import CalibrationCanvas from './components/CalibrationCanvas'
import DeleteModal from './components/DeleteModal'
import CalibrationSidebar from './components/CalibrationSidebar'
import CalibrationToolbar from './components/CalibrationToolbar'
import { useCalibrationController } from './hooks/useCalibrationController'

export default function CalibrationPage() {
  const calibration = useCalibrationController()

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

          <CalibrationCanvas
            containerRef={calibration.containerRef}
            annotations={calibration.annotations}
            selectedAnnotationId={calibration.selectedAnnotationId}
            editingAnnotationId={calibration.editingAnnotationId}
            hoveredAnnotationId={calibration.hoveredAnnotationId}
            drawingPoints={calibration.drawingPoints}
            pendingPoint={calibration.pendingPoint}
            polygonCloseReady={calibration.polygonCloseReady}
            rectStart={calibration.rectStart}
            rectCurrent={calibration.rectCurrent}
            selectedBounds={calibration.selectedBounds}
            toolMode={calibration.toolMode}
            activeLabelName={calibration.activeLabel.name}
            drawHint={calibration.drawHint}
            isPanning={calibration.isPanning}
            isSpacePressed={calibration.isSpacePressed}
            viewTransform={calibration.viewTransform}
            onMouseMove={calibration.handleCanvasMouseMove}
            onMouseDown={calibration.handleCanvasMouseDown}
            onMouseUp={calibration.handleCanvasMouseUp}
            onMouseLeave={calibration.handleCanvasMouseLeave}
            onClick={calibration.handleCanvasClick}
            onDoubleClick={calibration.handleCanvasDoubleClick}
            onWheel={calibration.handleCanvasWheel}
            beginAnchorDrag={calibration.beginAnchorDrag}
          />

          <CalibrationToolbar
            toolMode={calibration.toolMode}
            activeShapeType={calibration.activeLabel.shapeType}
            drawDisabled={calibration.drawDisabled}
            activeLabelName={calibration.activeLabel.name}
            switchTool={calibration.switchTool}
            zoomBy={calibration.zoomBy}
            resetViewTransform={calibration.resetViewTransform}
          />
        </div>

        <CalibrationSidebar
          annotations={calibration.annotations}
          activeLabelId={calibration.activeLabelId}
          selectedAnnotationId={calibration.selectedAnnotationId}
          hoveredAnnotationId={calibration.hoveredAnnotationId}
          hoveredIcon={calibration.hoveredIcon}
          renameAnnotationId={calibration.renameAnnotationId}
          renameValue={calibration.renameValue}
          searchQuery={calibration.searchQuery}
          filteredQuery={calibration.filteredQuery}
          hasUnsavedChanges={calibration.hasUnsavedChanges}
          saveState={calibration.saveState}
          lastSavedAt={calibration.lastSavedAt}
          renameInputRef={calibration.renameInputRef}
          selectLabel={calibration.selectLabel}
          setSearchQuery={calibration.setSearchQuery}
          setHoveredAnnotationId={calibration.setHoveredAnnotationId}
          setHoveredIcon={calibration.setHoveredIcon}
          setSelectedAnnotationId={calibration.setSelectedAnnotationId}
          setEditingAnnotationId={calibration.setEditingAnnotationId}
          setToolMode={calibration.setToolMode}
          setDeleteState={calibration.setDeleteState}
          setRenameValue={calibration.setRenameValue}
          setRenameAnnotationId={calibration.setRenameAnnotationId}
          commitRename={calibration.commitRename}
          startRename={calibration.startRename}
          toggleAnnotationVisibility={calibration.toggleAnnotationVisibility}
          toggleLabelVisibility={calibration.toggleLabelVisibility}
          saveCalibration={calibration.saveCalibration}
          formatTimestamp={calibration.formatTimestamp}
        />
      </section>

      <DeleteModal
        deleteState={calibration.deleteState}
        onClose={() => calibration.setDeleteState(null)}
        onConfirm={calibration.confirmDelete}
      />

      {calibration.saveState === 'saved' ? (
        <div className="save-toast" role="status" aria-live="polite">
          Calibration JSON exported successfully.
        </div>
      ) : null}
    </main>
  )
}
