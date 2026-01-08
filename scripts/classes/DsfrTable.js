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
      record.forEach((content, index)=> {
        const isFirst = index === 0
        const cell = document.createElement(isFirst ? 'th' : 'td')
        if (isFirst) {
          cell.classList.add('fr-col--sm')
          cell.classList.add('fr-cell--fixed')
        }
        cell.textContent = content
        tr.appendChild(cell)
      })
      fragment.appendChild(tr)
    })
    this.rowsContainer.appendChild(fragment)
  }

  addClasses() {
    this.tableDom.classList.add('fr-table--bordered')
    this.tableDom.classList.add(...this.customClasses)
  }
}

export default DsfrTable