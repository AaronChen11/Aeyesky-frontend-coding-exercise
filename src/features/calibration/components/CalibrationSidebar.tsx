import { LABELS } from '../../../shared/constants/calibration'
import {
  EyeClosedIcon,
  EyeOpenIcon,
  PolygonShapeIcon,
  RectangleShapeIcon,
  TrashIcon,
} from '../../../shared/components/icons'
import type { Annotation } from '../../../shared/types/calibration'

type CalibrationSidebarProps = {
  annotations: Annotation[]
  activeLabelId: string
  selectedAnnotationId: string | null
  hoveredAnnotationId: string | null
  hoveredIcon: { id: string; type: 'eye' | 'delete' } | null
  renameAnnotationId: string | null
  renameValue: string
  searchQuery: string
  filteredQuery: string
  hasUnsavedChanges: boolean
  saveState: 'idle' | 'saved'
  lastSavedAt: string | null
  renameInputRef: React.RefObject<HTMLInputElement | null>
  selectLabel: (labelId: string) => void
  setSearchQuery: (value: string) => void
  setHoveredAnnotationId: (annotationId: string | null) => void
  setHoveredIcon: (value: { id: string; type: 'eye' | 'delete' } | null) => void
  setSelectedAnnotationId: (annotationId: string | null) => void
  setEditingAnnotationId: (annotationId: string | null) => void
  setToolMode: (mode: 'select' | 'draw') => void
  setDeleteState: (
    value:
      | { type: 'annotation'; annotationId: string }
      | { type: 'label'; labelId: string }
      | null,
  ) => void
  setRenameValue: (value: string) => void
  setRenameAnnotationId: (value: string | null) => void
  commitRename: () => void
  startRename: (annotation: Annotation) => void
  toggleAnnotationVisibility: (annotationId: string) => void
  toggleLabelVisibility: (labelId: string) => void
  saveCalibration: () => void
  formatTimestamp: (value: string | null) => string
}

export default function CalibrationSidebar({
  annotations,
  activeLabelId,
  selectedAnnotationId,
  hoveredAnnotationId,
  hoveredIcon,
  renameAnnotationId,
  renameValue,
  searchQuery,
  filteredQuery,
  hasUnsavedChanges,
  saveState,
  lastSavedAt,
  renameInputRef,
  selectLabel,
  setSearchQuery,
  setHoveredAnnotationId,
  setHoveredIcon,
  setSelectedAnnotationId,
  setEditingAnnotationId,
  setToolMode,
  setDeleteState,
  setRenameValue,
  setRenameAnnotationId,
  commitRename,
  startRename,
  toggleAnnotationVisibility,
  toggleLabelVisibility,
  saveCalibration,
  formatTimestamp,
}: CalibrationSidebarProps) {
  return (
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
                <span className="label-row__bar" style={{ backgroundColor: label.color }} />
                <span className="label-row__shape-icon">
                  {label.shapeType === 'polygon' ? <PolygonShapeIcon /> : <RectangleShapeIcon />}
                </span>
                <span className="label-row__content">
                  <span className="label-row__name">{label.name}</span>
                  <span className="label-row__description">{label.description}</span>
                </span>
                <span className="label-row__status">
                  {hasStatusDot ? (
                    <span className={statusDotClass} />
                  ) : (
                    <span className="label-row__status-dot is-empty" />
                  )}
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
            aria-label="Search labelled areas"
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
                    aria-label={
                      labelVisible
                        ? `Hide all ${label.name} regions`
                        : `Show all ${label.name} regions`
                    }
                  >
                    {labelVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                  </button>
                  <span className="annotation-group__bar" style={{ backgroundColor: label.color }} />
                  <span className="annotation-group__name-wrap">
                    <span className="annotation-group__name">{label.name}</span>
                  </span>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => setDeleteState({ type: 'label', labelId: label.id })}
                    aria-label={`Delete all ${label.name} regions`}
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
                        onMouseEnter={() => setHoveredIcon({ id: annotation.id, type: 'eye' })}
                        onMouseLeave={() => setHoveredIcon(null)}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleAnnotationVisibility(annotation.id)
                        }}
                        aria-label={annotation.visible ? `Hide ${annotation.name}` : `Show ${annotation.name}`}
                      >
                        {annotation.visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </button>
                      <span className="annotation-row__bar-spacer" aria-hidden="true" />
                      <span
                        className="annotation-row__index"
                        style={{
                          backgroundColor: isSelected ? '#6b63ff' : '#eef2f7',
                          color: isSelected ? '#ffffff' : '#5f6b7a',
                        }}
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
                            annotation.visible ? 'annotation-row__name' : 'annotation-row__name is-muted'
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
                        onMouseEnter={() => setHoveredIcon({ id: annotation.id, type: 'delete' })}
                        onMouseLeave={() => setHoveredIcon(null)}
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteState({ type: 'annotation', annotationId: annotation.id })
                        }}
                        aria-label={`Delete ${annotation.name}`}
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
          Coordinates are saved as normalized polygons: each point is <code>{'{ x, y }'}</code> in
          the range <code>0–1</code>, measured from the top-left corner of the image.
        </p>
      </section>
    </aside>
  )
}
