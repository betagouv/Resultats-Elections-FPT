import valuesUtils from '../utils/values.js'

class DsfrTable {
  constructor(props) {
    const { headers, rows, customClasses, tableDom } = props
  
    this.headers = headers
    this.rows = rows
    this.customClasses = customClasses
    this.tableDom = tableDom

    this.init()
  }

  init() {
    this.getDomElements()
    this.addClasses()
    this.addHeaders()
    this.addRows()
  }

  getDomElements() {
    this.headersContainer = this.tableDom.querySelector('thead')
    this.rowsContainer = this.tableDom.querySelector('tbody')
  }

  addHeaders() {
    const tr = document.createElement('tr')
    this.headers.forEach((header, index)=> {
      const cell = document.createElement('th')
      const isFirst = index === 0
      cell.textContent = header
      cell.setAttribute('role', isFirst ? 'columnheader' : 'col')
      if (isFirst) cell.classList.add('fr-cell--fixed')
      tr.appendChild(cell)
    })
    this.headersContainer.appendChild(tr)
  }

  addRows() {
    const fragment = document.createDocumentFragment()
    this.rows.forEach(record => {
      const tr = document.createElement('tr')
      record.forEach((column, index) => this.addCell(column, index, tr))
      fragment.appendChild(tr)
    })
    this.rowsContainer.appendChild(fragment)
  }

  addCell(column, index, tr) {
    const isFirst = index === 0
    const cell = document.createElement(isFirst ? 'th' : 'td')
    if (isFirst) {
      cell.classList.add('fr-col--sm')
      cell.classList.add('fr-cell--fixed')
    }
    if (column.infos.type === 'Bool') cell.appendChild(this.addBadge(column.value))
    else if (!column.value) cell.textContent = ''
    else if (typeof column.value !== 'string') cell.innerHTML = valuesUtils.prettifyList(column.value)
    else if (column.infos.type.indexOf('Ref:') >= 0) cell.appendChild(this.addTag(column.value))
    else cell.textContent = valuesUtils.prettify(column.value)
    tr.appendChild(cell)
  }

  addBadge(value){
    const type = value ? 'success' : 'error'
    const badge = document.createElement('p')
    badge.classList.add('fr-badge', `fr-badge--${type}`)
    badge.textContent = value ? 'Oui' : 'Non'
    return badge
  }

  addTag(value){
    const tag = document.createElement('span')
    tag.classList.add('fr-tag', 'fr-tag--sm')
    tag.textContent = value
    return tag
  }

  addClasses() {
    this.tableDom.classList.add('fr-table--bordered')
    this.tableDom.classList.add(...this.customClasses)
  }
}

export default DsfrTable