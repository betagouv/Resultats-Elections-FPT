/* IMPORTS */
import DsfrTable from '../scripts/classes/DsfrTable.js'

/* VAR */
const tableElement = document.querySelector('[data-js="dsfr-table"]')
let columnsMapped = null

/* TABLE */
const tableHeaders = ["Nom de la collectivité", "Type de collectivité", "Scrutin CST", "Scrutin CCP", "Scrutin CAP", "Scrutins_Absence", "Prefecture__Validation_Carto_DGCL", "Prefecture__Validation_Carto_PREF", "Derniere_modification"]
const dsfrTable = new DsfrTable({
  headers: tableHeaders,
  customClasses: ['fr-mt-0'],
  tableDom: tableElement,
})

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
  if (table.length > 0) {
    dsfrTable.removeRows()
    const rows = getColumnMappedRow(table)
    dsfrTable.displayRows(rows)
  }
})

const getColumnMappedRow = (table) => {
  const records = []
  table.forEach(record => {
    const row = []
    for (const data of columnsMapped) row.push(record[data])
    records.push(row)
  })
  return records
}
