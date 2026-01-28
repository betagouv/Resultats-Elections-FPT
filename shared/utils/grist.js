const getTableColumnsInfos = async () => {
  const tableName = await grist.getSelectedTableId()
  const allTables = await grist.docApi.fetchTable('_grist_Tables')
  const tableId = allTables.id[allTables.tableId.indexOf(tableName)]
  const allGristColumns = await grist.docApi.fetchTable('_grist_Tables_column')
  let index = 0
  const columnsInfos = allGristColumns.parentId.reduce(function (
    filtered,
    currentValue
  ) {
    if (currentValue === tableId)
      filtered.push({
        label: allGristColumns.label[index],
        description: allGristColumns.description[index],
        colId: allGristColumns.colId[index],
        type: allGristColumns.type[index],
        widgetOptions: allGristColumns.widgetOptions[index],
      })
    index++
    return filtered
  },
  [])
  return columnsInfos
}

const getColumnsInfos = (columns, table) => {
  return table.filter((col) => columns.includes(col.colId))
}

const getColumnInfos = (column, table) => {
  const index = table.findIndex((col) => col.colId === column)
  return index >= 0 ? table[index] : null
}

const getColumnName = (id, table) => {
  return table.value.find(column => column.colId === id)?.label
}

const getHtmlType = (type) => {
  if (type.indexOf('Ref:') >= 0 || type === 'Choice') return 'select'
  if (type === 'Int' || type === 'Numeric') return 'number'
  if (type === 'Bool') return 'checkbox'
  if (type === 'Attachments') return 'file'
  return 'text'
}

const getCurrentTableID = async () => {
  return await grist.getSelectedTableId()
}

const getTable = async (name) => {
  return await grist.docApi.fetchTable(name)
}

export default {
  getTableColumnsInfos,
  getCurrentTableID,
  getColumnsInfos,
  getColumnInfos,
  getColumnName,
  getHtmlType,
  getTable,
}
