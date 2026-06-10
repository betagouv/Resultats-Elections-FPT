const getTableColumnsInfos = async () => {
  const tableName = await grist.getSelectedTableId()
  const token = await grist.docApi.getAccessToken({ readOnly: false })
  const url = `${token.baseUrl}/tables/${tableName}/columns?auth=${token.token}`
  const response = await fetch(url)
  if (!response.ok) return []
  const { columns } = await response.json()
  return columns.map((c) => ({
    label: c.fields.label,
    description: c.fields.description,
    colId: c.id,
    type: c.fields.type,
    widgetOptions: c.fields.widgetOptions,
  }))
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
