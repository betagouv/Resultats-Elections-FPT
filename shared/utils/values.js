import { jsonrepair } from 'jsonrepair'

const removeSpecialChars = (string) => {
  return string
    .trim()
    .toLowerCase()
    .replaceAll("-", " ")
    .replaceAll("'", " ")
    .replaceAll("  ", " ") // Remove double spaces
    .normalize("NFD") // Convert string to unicode normalize : needed for accent replacement
    .replace(/[\u0300-\u036f]/g, "") // Remove accents : all chars between unicode U+0300 to U+036F
}

const isInString = (string, value) => {
  if (typeof string !== 'string') return false // Censored values
  const stringClean = removeSpecialChars(string)
  const valueClean = removeSpecialChars(value)
  return stringClean.indexOf(valueClean) >= 0
}

const prettify = (value) => {
  if (value === true) return 'oui'
  if (value === false) return 'non'
  if (value === null || value.length === 0) return 'non renseigné'
  return value
}

const cleanUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  try {
    return encodeURI(decodeURI(url.trim()))
  } catch {
    return encodeURI(url.trim())
  }
}

const cleanJson = (value) => {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return JSON.parse(jsonrepair(value))
  }
}

const isPercent = (columnInfos) => {
  const widgetOptions = columnInfos?.widgetOptions
  if (!widgetOptions) return false
  const widgetInfos = JSON.parse(widgetOptions)
  return widgetInfos?.numMode === "percent"
}

const prettifyToPercent = (value) => {
  const percentage = value * 100
  const percentTwoDecimals = percentage.toFixed(2)
  return `${percentTwoDecimals} %`
}

const getExcelCellFormat = (cell) => {
  if (cell.isPercent) return '0.00%'
  return null
}

const getExcelCellType = (cell) => {
  if (cell.type === 'Int' || cell.type === 'Numeric' || cell.isPercent) return Number
  if (cell.type === 'Bool') return Boolean
  else return String
}

const getExcelCellValue = (cell) => {
  if (cell.isDSFRBadge) return cell.value.text
  else return cell.value
}

export default { isInString, prettify, cleanUrl, cleanJson, isPercent, prettifyToPercent, getExcelCellFormat, getExcelCellType, getExcelCellValue }
