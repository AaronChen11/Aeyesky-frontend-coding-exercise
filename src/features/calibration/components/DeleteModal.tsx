import type { DeleteState } from '../../../shared/types/calibration'

type DeleteModalProps = {
  deleteState: DeleteState
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteModal({ deleteState, onClose, onConfirm }: DeleteModalProps) {
  if (!deleteState) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
          <button type="button" className="modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modal-btn modal-btn--danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
