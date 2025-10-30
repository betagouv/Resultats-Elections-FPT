const containsValue = (string, value) => {
    if (typeof value !== "string") return false // Censored values
    const stringClean = string.toLowerCase()
    const valueLower = value.toLowerCase()
    return stringClean.indexOf(valueLower) >= 0
}

export default { containsValue }