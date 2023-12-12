import React from 'react'
import { Modal } from 'reactstrap'

function DeleteRowsModal({
  show,
  handleClose,
  deleteAllRowsContext,
}: {
  show: boolean
  handleClose: () => void
  deleteAllRowsContext: () => void
}) {
  return (
    <Modal isOpen={show} toggle={handleClose}>
      <div className="modal-header">
        <h5 className="modal-title">Delete Rows</h5>
        <button
          aria-label="Close"
          className="close"
          data-dismiss="modal"
          type="button"
          onClick={handleClose}
        >
          <span aria-hidden={true}>×</span>
        </button>
      </div>
      <div className="modal-body">
        <p>Are you sure you want to delete all rows?</p>
      </div>
      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={handleClose}
          type="button"
        >
          Cancel
        </button>

        <button
          className="btn btn-danger"
          onClick={() => {
            deleteAllRowsContext()
            handleClose()
          }}
          type="button"
        >
          Delete All Rows
        </button>
      </div>
    </Modal>
  )
}

export default DeleteRowsModal
