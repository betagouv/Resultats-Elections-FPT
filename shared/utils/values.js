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

export default { isInString, prettify, cleanUrl }
