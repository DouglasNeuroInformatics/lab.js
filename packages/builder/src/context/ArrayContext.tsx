import { getIn } from 'formik'

import React, { createContext } from 'react'

type Row = any[]
type Column = any[]
type Values = any

type ArrayContextProviderProps = {
  name: string
  values: Values
  arrayHelpers: any
  setValues: (values: Values) => void
  setFieldValue: (name: string, newValue: any) => void
  [key: string]: any
}

type DispatchCallback = (rows: Row[], columns: Column[]) => [any[], any[]]

type ArrayContextType = {
  [K in keyof ArrayContextProviderProps as K extends 'name' | "values" | "arrayHelpers"
    ? never
    : K]: ArrayContextProviderProps[K]
} & {
  dispatch: (callback: DispatchCallback) => void
  overwriteAll: (rows: any[], columns: any[]) => void
  addRow: () => void
  addColumn: (defaultCell: any, defaultColumn: any) => void
  clearColumn: (index: number) => void
  deleteAllRows: () => void
  fillColumn: (index: number) => void
  deleteColumn: (index: number) => void
}

export const ArrayContext = createContext<ArrayContextType>(null!)

export const ArrayContextProvider = ({
  name,
  values,
  arrayHelpers,
  setValues,
  setFieldValue,
  ...props
}: ArrayContextProviderProps) => {
  // Return an empty array if getIn returns undefined
  const getRows = (): Row[] => getIn(values, name) ?? []

  const overwriteRows = (newValue: any) => setFieldValue(name, newValue)

  // TODO: A fair amount of these helper functions are grid-specific.
  // Maybe it might be worth investigating splitting them out
  const overwriteAll: ArrayContextType['overwriteAll'] = (rows, columns) => {
    const baseName = name.replace('.rows', '')

    setValues({
      ...values,
      [baseName]: {
        ...getIn(values, baseName),
        rows,
        columns,
      },
    })
  }

  const dispatch: ArrayContextType['dispatch'] = (fn) => {
    const columnName = name.replace('.rows', '.columns')
    const [rows, columns] = fn(
      getIn(values, name) ?? [],
      getIn(values, columnName) ?? [],
    )
    overwriteAll(rows, columns)
  }

  const addRow = () => arrayHelpers.push([])

  const mapRows = (fn: (row: Row, index: number) => Row[]) =>
    overwriteRows(getRows().map(fn))

  const addColumn: ArrayContextType['addColumn'] = (defaultCell, defaultColumn) =>
    dispatch((rows, columns) => [
      rows.map((row: any) => [...row, defaultCell]),
      [...columns, defaultColumn],
    ])

  const deleteColumn = (index: number) =>
    dispatch((rows, columns) => [
      rows.map((row) => row.filter((_, i) => i !== index)),
      columns.filter((_, i) => i !== index),
    ])

  const deleteAllRows = () => {
    const rows = getRows()
    for (let i = rows.length - 1; i >= 0; i--) {
      arrayHelpers.remove(i)
    }
    arrayHelpers
  }

  const clearColumn = (index: number) =>
    mapRows((row) => {
      const output = [...row]
      output[index] = ''
      return output
    })

  const fillColumn = (index: number) => {
    // Gather cells with content
    const availableCells = getRows()
      .map((r) => r[index])
      .filter((r) => r !== '')

    return mapRows((r, rowIndex) => {
      const output = [...r]
      output[index] =
        output[index] || availableCells[rowIndex % availableCells.length]
      return output
    })
  }

  return (
    <ArrayContext.Provider
      value={{
        setValues,
        setFieldValue,
        dispatch,
        overwriteAll,
        addRow,
        addColumn,
        clearColumn,
        deleteAllRows,
        fillColumn,
        deleteColumn,
      }}
      {...props}
    />
  )
}
