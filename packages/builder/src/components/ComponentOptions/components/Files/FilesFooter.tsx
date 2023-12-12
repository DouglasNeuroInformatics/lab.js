import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { Button } from 'reactstrap'

import { useArrayContext } from '@/hooks/useArrayContext'
import FileSelector from '@/components/FileSelector'
import DeleteRowsModal from '@/components/Modal/components/DeleteRows/DeleteRowsModal'
import Icon from '@/components/Icon'

const Footer: React.FC = (_, { id }) => {
  const fileSelector = React.createRef<any>()
  const { deleteAllRows } = useArrayContext()

  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleOpen = () => setShow(true)

  return (
    <>
      <tfoot>
        <tr>
          <td />
          <td>
            <FileSelector ref={fileSelector} component={id} />
            <Button
              size="sm"
              block
              outline
              color="muted"
              className="hover-target"
              onClick={() => {
                fileSelector.current?.select().catch((error: any) => {
                  console.error('Error while adding file', error)
                })
              }}
              onMouseUp={(e) => e.currentTarget.blur()}
            >
              <Icon {...({ icon: 'plus' } as any)} />
            </Button>
            <Button
              size="sm"
              block
              outline
              color="muted"
              className="hover-target"
              onClick={handleOpen}
              onMouseUp={(e) => e.currentTarget.blur()}
            >
              <Icon {...({ icon: 'trash' } as any)} />
            </Button>
          </td>
          <td />
        </tr>
      </tfoot>
      {ReactDOM.createPortal(
        <DeleteRowsModal
          show={show}
          handleClose={handleClose}
          deleteAllRowsContext={deleteAllRows}
        ></DeleteRowsModal>,
        document.body,
      )}
    </>
  )
}

Footer.contextTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default Footer
