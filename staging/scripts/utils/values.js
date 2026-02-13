const removeSpecialChars = (string) => {
  return string
    .toLowerCase()
    .replaceAll("-", " ")
    .replaceAll("'", " ")
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

export default { isInString, prettify }
