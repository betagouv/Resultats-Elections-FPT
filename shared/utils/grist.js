const getTableColumnsInfos = async () => {
  const [allTables, allColumns, tableName] = await Promise.all([
    grist.docApi.fetchTable('_grist_Tables'),
    grist.docApi.fetchTable('_grist_Tables_column'),
    grist.getSelectedTableId()
  ])
  const tableId = allTables.id[allTables.tableId.indexOf(tableName)]
  return allColumns.parentId.reduce((filtered, parentId, index) => {
    if (parentId === tableId) {
      filtered.push({
        label: allColumns.label[index],
        description: allColumns.description[index],
        colId: allColumns.colId[index],
        type: allColumns.type[index],
        widgetOptions: allColumns.widgetOptions[index],
      })
    }
    return filtered
  }, [])
}

const getColumnsInfos = (columns, table) => {
  return table.filter((col) => columns.includes(col.colId))
}

const getColumnInfos = (column, table) => {
  return table.find((col) => col.colId === column) ?? null
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
