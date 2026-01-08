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
    // TODO START DEBUG 
    const rowsToDisplay = this.rows.slice(0, 10)
    // END DEBUG
    
    const fragment = document.createDocumentFragment()
    rowsToDisplay.forEach(record => {
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
    if (column.infos.type === 'Bool') this.addBadge(cell, column.value)
    else if (column.value !== '') cell.textContent = valuesUtils.prettify(column.value)
    else cell.textContent = ''
    tr.appendChild(cell)
  }

  addBadge(cell, value){
    const type = value ? 'success' : 'error'
    const badge = document.createElement('p')
    badge.classList.add('fr-badge', `fr-badge--${type}`)
    badge.textContent = value ? 'Oui' : 'Non'
    cell.appendChild(badge)
  }

  addClasses() {
    this.tableDom.classList.add('fr-table--bordered')
    this.tableDom.classList.add(...this.customClasses)
  }
}

export default DsfrTable