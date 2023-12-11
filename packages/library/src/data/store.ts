import { saveAs } from 'file-saver'
import {
  cloneDeep,
  flatten,
  difference,
  intersection,
  sortedUniq,
  pick,
} from 'lodash'

import { Emitter } from '../base/util/emitter'
import { dateString } from './util/dates'
import { cleanData } from './util/clean'
import { toCsv } from './util/csv'

export type BaseRow = {
  sender: string
  sender_type: string
  sender_id: string
  timestamp: Date
  meta: object
  time_run: number
  time_render: number
  time_show: number
  time_end: number
  time_switch: number
  time_lock: number
}

export type Row = Partial<BaseRow> & Record<string, unknown>
export type Table<R> = Array<R>
export type FileFormat = 'csv' | 'json' | 'jsonl'

// Default column names -----------------------------------

const defaultIdColumns = [
  // TODO: Standardize the id column and document
  // a single preferred name for it
  'id',
  'participant',
  'participant_id',
]

const defaultMetadata = [
  ...defaultIdColumns,
  'sender',
  'sender_type',
  'sender_id',
  'timestamp',
  'meta',
]

// Data storage class -------------------------------------

/**
 * Data storage class
 *
 * The data `Store` class deals with the data that accrues during every
 * study. It provides a basic tabular structure with rows and columns,
 * and the functionality to append more, as well as export to various
 * formats.
 *
 * There are a few additional features that are unique and worth mentioning.
 * * The most recent row, or the one that is currently being assembled
 *   before being added to the dataset, is known as the `staging` row.
 *   The store will keep track of this row as it is gradually filled,
 *   until it is appended to the remainder of the table.
 * * The most recent entry in any column is summarized in the `state`. This
 *   will (for every column) contain data from the last row in which a value
 *   was set. Note that this will include values in `staging`.
 */
export class Store<R extends Row = Row> extends Emitter {
  #state: R
  private staging: R
  data: Table<R>

  /**
   * Create a new data `Store`
   */
  constructor() {
    super()

    // Initialize empty state
    this.data = []
    this.#state = {} as R
    this.staging = {} as R
  }

  // Get and set individual values ------------------------
  /**
   * Set one or more values in the current staging row.
   */
  set(key: Partial<R>): void
  set(key: keyof R, value: any, suppressSetTrigger?: boolean): void
  set(
    key: keyof R | Partial<R>,
    value?: any,
    suppressSetTrigger = false,
  ): void {
    let partial: Partial<R> = {}
    if (typeof key === 'object') {
      partial = key
    } else {
      partial[key] = value
    }

    this.#state = Object.assign(this.#state, partial)
    this.staging = Object.assign(this.staging, partial)

    if (!suppressSetTrigger) {
      this.emit('set')
    }
  }

  /**
   * Get the state value for a given column
   *
   * @param key - Column name
   * @returns Value of the state for that column
   */
  get(key: string) {
    return this.#state[key]
  }

  /**
   * Test several column names, get the first existing entry
   *
   * @param keys - Array of column names
   * @returns The value in the first existing column
   */
  getAny(keys: string[] = []) {
    // Check whether any of the columns is present in the data --
    // if so, return its value
    for (const k of keys) {
      if (Object.keys(this.#state).includes(k)) {
        return this.#state[k]
      }
    }

    // If no value was found, return undefined
    return undefined
  }

  /**
   * Provide direct access to the data store state
   *
   * The store's `state` property functions as an object, so that keys
   * can be set and read directly on it. In each case, it will write to the
   * store `staging`, and read from the store `state`.
   */
  state = new Proxy(
    {},
    {
      get: (_, prop: string) => this.get(prop),
      set: (_, prop: string, value: any) =>
        // TODO can we improve on this?
        (this.set(prop, value) as unknown as boolean) || true,
      has: (_, prop) => Reflect.has(this.#state, prop),
      ownKeys: () => Reflect.ownKeys(this.#state),
      getOwnPropertyDescriptor: (_, prop) =>
        Reflect.getOwnPropertyDescriptor(this.#state, prop),
    },
  )

  /**
   * Commit data to storage
   *
   * @returns The row number of the newly added row
   */
  commit(): number {
    // Remember the index of the new entry
    const logIndex = this.data.push(cloneDeep(this.staging)) - 1
    this.staging = {} as R

    this.emit('commit')

    return logIndex
  }

  /**
   * Update an existing row in the data store
   *
   * @param index The number of the row to update
   * @param callback A function that operates on the row to create a new entry
   */
  update(index: number, callback = (d: R): R => d) {
    this.data[index] = callback(this.data[index] || ({} as R))
    this.emit('update')
  }

  /**
   * Erase the collected data
   */
  clear() {
    this.emit('clear')

    this.data = []
    this.staging = {} as R
    this.#state = {} as R
  }

  _hydrate({ data = [], state = {} as R }: { data: Table<R>; state: R }) {
    this.data = data
    this.#state = state
  }

  /**
   * Extract keys/column names from all rows
   *
   * @param includeState Include keys from the current state
   * @param prioritize Keys/column names to move to the start of the array
   * @returns Array of keys/column names
   */
  keys(includeState = false, prioritize = defaultMetadata) {
    // Extract all keys from the data collected
    const keys = this.data.map(e => Object.keys(e))

    // Include keys from state
    if (includeState) {
      keys.push(Object.keys(this.#state))
    }

    // Flatten the nested array
    const flatKeys = flatten(keys)

    // Sort alphabetically and remove duplicates
    // (sorting apparently needs to be done twice)
    flatKeys.sort()
    const uniqueKeys = sortedUniq(flatKeys).sort()

    // Bring certain columns to the front
    const prioritizedKeys = intersection(prioritize, uniqueKeys)
    const remainingKeys = difference(uniqueKeys, prioritizedKeys)

    return prioritizedKeys.concat(remainingKeys)
  }

  /**
   * Extract a single column from the data, optionally filtering by the sender column
   *
   * @param column Name of column/key to extract across all rows
   * @param senderRegExp String pattern or regular expression to apply to the `sender` value in each row
   * @returns Array of values from a particular column
   */
  extract(column: string, senderRegExp: RegExp | string = RegExp('.*')) {
    // If the filter is defined a a string,
    // convert it into the corresponding
    // regular expression.
    const filter =
      typeof senderRegExp === 'string'
        ? RegExp(`^${senderRegExp}$`)
        : senderRegExp

    // Filter the data using the sender column,
    // and then extract the column in question
    return this.data
      .filter(r => filter.test(r.sender ?? ''))
      .map(r => r[column])
  }

  /**
   * Select a subset of columns from the data table
   *
   * @param selector Array of strings, a string, or a filter function to select columns by
   * @param senderRegExp String pattern or regular expression to apply to the `sender` values in every row
   * @returns An array of rows, containing only the specified columns
   */
  select(
    selector: keyof R | (keyof R)[] | ((key: keyof R) => boolean),
    senderRegExp = RegExp('.*'),
  ) {
    let columns: (keyof R)[]
    if (typeof selector === 'function') {
      columns = this.keys().filter(selector)
    } else if (typeof selector === 'string') {
      columns = [selector]
    } else {
      columns = selector as (keyof R)[]
    }

    if (!Array.isArray(columns)) {
      throw new Error(
        'The input parameter should be either an array of strings, ' +
          'a string, or a filter function.',
      )
    }

    // As above
    const filter =
      typeof senderRegExp === 'string'
        ? RegExp(`^${senderRegExp}$`)
        : senderRegExp

    return this.data
      .filter(r => filter.test(r.sender ?? ''))
      .map(r => pick(r, columns))
  }

  /**
   * Omit columns/keys that start with an underscore
   */
  get cleanData(): Table<Partial<R>> {
    return cleanData(this.data)
  }

  /**
   * Export data in JSON format
   *
   * @param clean Omit keys/columns starting with an underscore
   * @returns A JSON string representing the data store
   */
  exportJson(clean = true) {
    // Optionally export raw data
    const data = clean ? this.cleanData : this.data

    // Export data a JSON string
    return JSON.stringify(data)
  }

  /**
   * Export data in JSONL format
   * (see http://jsonlines.org/)
   *
   * @param clean Omit keys/columns starting with an underscore
   * @returns A JSONL string representing the data store
   */
  exportJsonL(clean = true) {
    // Optionally export raw data
    const data = clean ? this.cleanData : this.data

    return data.map(e => JSON.stringify(e)).join('\n')
  }

  /**
   * Export data in CSV format
   *
   * @param separator Column separator
   * @param clean Omit keys/columns starting with an underscore
   * @returns A CSV string representing the data store contents
   */
  exportCsv(separator = ',', clean = true) {
    // Export data as csv string
    // Optionally export raw data
    const data = clean ? this.cleanData : this.data

    // If exporting the cleaned data, remove keys
    // that start with an underscore
    const keys = this.keys().filter(k => !clean || !k.startsWith('_'))

    return toCsv(data, keys, separator)
  }

  /**
   * Export data to blob representing the output file
   *
   * @param format Output format, `csv`, `json` or `jsonl`
   * @param clean
   * @returns
   */
  exportBlob(format: FileFormat = 'csv', clean = true) {
    // Assemble the text representation
    // of the current data
    let text = ''

    if (format === 'csv') {
      text = this.exportCsv(undefined, clean)
    } else if (format === 'json') {
      text = this.exportJson(clean)
    } else if (format === 'jsonl') {
      text = this.exportJsonL(clean)
    } else {
      throw new Error(`Unsupported format ${format}`)
    }

    const mime = {
      csv: 'text/csv',
      json: 'application/json',
      jsonl: 'application/jsonl',
    }[format]

    // Convert the so encoded data to a blob object
    return new Blob([text], { type: mime })
  }

  /**
   * Extract a participant id by going through likely columns and returning the first available value
   * @param columns Columns to check
   * @returns
   */
  guessId(columns: string[] = defaultIdColumns) {
    return this.getAny(columns)
  }

  /**
   * Suggest a filename from prefix, inferred participant id, and file extension
   *
   * @param prefix Optional prefix (defaults to `study`)
   * @param extension Optional file extension (defaults to `csv`)
   * @returns
   */
  makeFilename(prefix = 'study', extension = 'csv') {
    // Extract an id from the data, if available
    const id = this.guessId()

    return (
      prefix +
      '--' +
      (id ? `${id}--` : '') +
      dateString() +
      (extension ? `.${extension}` : '')
    )
  }

  /**
   * Download data file in browser
   *
   * @param format Output format, one of `csv` (default), `json` and `jsonl`
   * @param filename Output filename
   */
  download(format: FileFormat = 'csv', filename?: string) {
    saveAs(
      this.exportBlob(format),
      filename ?? this.makeFilename('data', format),
    )
  }

  /**
   * Display data on the console
   */
  show() {
    console.table(
      this.data,
      this.keys(), // Use a neater column order
    )
  }
}
