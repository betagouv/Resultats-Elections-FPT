class Modal {
  constructor(props) {
    const { container } = props
    this.container = container
    this.init()
  }

  init() {
    this.setHTMLElements()
    this.addWatchers()
  }

  setHTMLElements() {
    this.open = this.container.querySelector('[data-js-modal="open"]')
    this.close = this.container.querySelector('[data-js-modal="close"]')
    this.dialog = this.container.querySelector('[data-js-modal="dialog"]')
  }

  addWatchers() {
    this.open.addEventListener('click', this.openDialog.bind(this))
    this.close.addEventListener('click', this.closeDialog.bind(this))
  }

  openDialog() {
    this.dialog.classList.add('fr-modal--opened')
    this.dialog.setAttribute('open', true)
  }

  closeDialog() {
    this.dialog.classList.remove('fr-modal--opened')
    this.dialog.setAttribute('open', false)
  }
}

export default Modal
