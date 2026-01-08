class DsfrTable {
  constructor(props) {
    const { headers, customClasses, tableDom } = props
  
    this.headers = headers
    this.customClasses = customClasses
    this.tableDom = tableDom

    this.init()
  }

  init() {
    this.getDomElements()
    this.addClasses()
    this.addHeaders()
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

  displayRows(rows) {
    const fragment = document.createDocumentFragment()
    rows.forEach(record => {
      const tr = document.createElement('tr')
      record.forEach((content, index)=> {
        const isFirst = index === 0
        const cell = document.createElement(isFirst ? 'th' : 'td')
        cell.classList.add('fr-col--sm')
        if (isFirst) cell.classList.add('fr-cell--fixed')
        cell.textContent = content
        tr.appendChild(cell)
      })
      fragment.appendChild(tr)
    })
    this.rowsContainer.appendChild(fragment)
  }

  removeRows() {
    this.rowsContainer.replaceChildren()
  }

  addClasses() {
    this.tableDom.classList.add('fr-table--bordered')
    this.tableDom.classList.add(...this.customClasses)
  }
}

export default DsfrTable