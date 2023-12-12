import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import {
  InputGroupButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  InputGroup,
} from 'reactstrap'
import classnames from 'classnames'

import { useArrayContext } from '@/hooks/useArrayContext'
import { FastField, useField } from 'formik'
import { range } from 'lodash'
import DeleteRowsModal from '@/components/Modal/components/DeleteRows/DeleteRowsModal'
import { ButtonCell, DefaultHeader } from '@/components/Form/table'
import Icon from '@/components/Icon'

const CellTypeDropdown = ({ name, index, actions, disabled = false }) => {
  const [field, , helpers] = useField(name)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <InputGroupButtonDropdown
      addonType="append"
      disabled={disabled}
      isOpen={dropdownOpen}
      toggle={() => setDropdownOpen(!dropdownOpen)}
    >
      <DropdownToggle
        caret={!disabled}
        disabled={disabled}
        outline
        color="secondary"
        // Ensure that the right-hand side always has rounded corners
        // (this didn't work if the button was disabled)
        className="rounded-right"
      >
        <Icon
          icon={
            {
              string: 'font',
              number: 'tachometer',
              boolean: 'adjust',
            }[field.value]
          }
          fixedWidth
        />
      </DropdownToggle>
      <DropdownMenu right>
        <DropdownItem header>Data type</DropdownItem>
        <DropdownItem
          className={classnames({
            'dropdown-item-active': field.value === 'string',
          })}
          onClick={() => helpers.setValue('string')}
        >
          Text <span className="text-muted">(categorical)</span>
        </DropdownItem>
        <DropdownItem
          className={classnames({
            'dropdown-item-active': field.value === 'number',
          })}
          onClick={() => helpers.setValue('number')}
        >
          Numerical <span className="text-muted">(continuous)</span>
        </DropdownItem>
        <DropdownItem
          className={classnames({
            'dropdown-item-active': field.value === 'boolean',
          })}
          onClick={() => helpers.setValue('boolean')}
        >
          Boolean <span className="text-muted">(binary)</span>
        </DropdownItem>
        {actions ? (
          <div>
            <DropdownItem divider />
            <DropdownItem header>Actions</DropdownItem>
            {Object.entries(actions).map(([k, v], i) => (
              <DropdownItem onClick={() => v(index)} key={i}>
                {k}
              </DropdownItem>
            ))}
          </div>
        ) : (
          <div></div>
        )}
      </DropdownMenu>
    </InputGroupButtonDropdown>
  )
}

export const HeaderCell = ({ index, actions }) => (
  <InputGroup>
    <FastField
      name={`templateParameters.columns[${index}].name`}
      placeholder={`parameter${index}`}
      className="form-control text-monospace font-weight-bolder"
      style={{ height: '42px' }}
    />
    <CellTypeDropdown
      name={`templateParameters.columns[${index}].type`}
      index={index}
      actions={actions}
    />
  </InputGroup>
)

const Header = ({ columns }) => {
  const { addColumn, fillColumn, clearColumn, deleteColumn, deleteAllRows } =
    useArrayContext()

  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleOpen = () => setShow(true)

  return (
    <>
      <DefaultHeader columns={columns}>
        <thead>
          <tr>
            <ButtonCell
              type="th"
              icon="trash"
              style={{ height: '42px' }}
              onClick={handleOpen}
            />
            {range(columns).map((_, i) => (
              <th key={`header-${i}`}>
                <HeaderCell
                  index={i}
                  actions={{
                    Fill: fillColumn,
                    Clear: clearColumn,
                    Delete: deleteColumn,
                  }}
                />
              </th>
            ))}
            <ButtonCell
              type="th"
              icon="plus"
              style={{ height: '42px' }}
              onClick={() => addColumn('', { name: '', type: 'string' })}
              disabled={columns >= 12}
            />
          </tr>
        </thead>
      </DefaultHeader>
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

export default Header
