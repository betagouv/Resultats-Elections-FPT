const isInString = (string, value) => {
  if (typeof string !== 'string') return false // Censored values
  const stringClean = string.toLowerCase()
  const valueLower = value.toLowerCase()
  return stringClean.indexOf(valueLower) >= 0
}

const prettify = (value) => {
  if (value === true) return 'oui'
  if (value === false) return 'non'
  if (value === null || value.length === 0) return 'non renseigné'
  return value
}

export default { isInString, prettify }
