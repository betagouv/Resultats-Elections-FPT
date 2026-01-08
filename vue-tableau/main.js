/* IMPORTS */
import DsfrTable from '../scripts/classes/DsfrTable.js'
import gristUtils from '../scripts/utils/grist.js'

/* VAR */
const tableElement = document.querySelector('[data-js="dsfr-table"]')
let columnsMapped = null
let tableColumnsInfos = []
let dsfrTable = null

/* GRIST */
grist.ready({
  requiredAccess: 'full',
  columns: [
    {
      name: 'columns',
      description: 'Colonnes du tableau',
      allowMultiple: true,
    },
  ],
})

grist.onRecords(async (table, mapping) => {
  columnsMapped = mapping['columns']
  await needsColumnInfos()
  if (table.length > 0) generateTable(table)
})

/* TABLE */
const generateTable = (table) => {
  dsfrTable = new DsfrTable({
    headers: getTableHeaders(),
    rows: getTableRows(table),
    customClasses: ['fr-mt-0'],
    tableDom: tableElement,
  })
}

const getTableHeaders = () => {
  const headers = []
  for (const column of columnsMapped) {
    const columnInfo = gristUtils.getColumnInfos(column, tableColumnsInfos)
    headers.push(columnInfo.label)
  }
  return headers
}

const getTableRows = (table) => {
  const records = []
  table.forEach(record => {
    const row = []
    for (const data of columnsMapped) row.push(record[data])
    records.push(row)
  })
  return records
}

/* COLUMNS INFOS */
const needsColumnInfos = async () => {
  if (tableColumnsInfos.length === 0) {
    tableColumnsInfos = await gristUtils.getTableColumnsInfos()
  }
}
