class Configuration {
  constructor(props) {
    const { name, label, onClose } = props;
    this.name = name;
    this.label = label;
    this.onClose = onClose;
    this.input = null;
    this.aside = null;
    this.value = null;
    this.init();
  }

  async init() {
    await this.setValue();
    this.createInDom();
  }

  async getValue() {
    if (!this.value) await this.setValue();
    return this.value;
  }

  async setValue() {
    this.value = await grist.getOption(this.name);
  }

  createInDom() {
    this.aside = document.createElement("aside");
    this.aside.classList.add("app-configuration", "fr-hidden");

    const close = document.createElement("button");
    close.textContent = "Fermer";
    close.classList.add("fr-mb-2w");
    close.addEventListener("click", this.close.bind(this), this);

    const label = document.createElement("label");
    label.textContent = `${this.label} :`;
    label.setAttribute("for", this.name);

    this.input = document.createElement("input");
    this.input.setAttribute("type", "text");
    this.input.setAttribute("name", this.name);
    this.input.setAttribute("id", this.name);
    if (this.value) this.input.value = this.value;

    this.aside.appendChild(close);
    this.aside.appendChild(label);
    this.aside.appendChild(this.input);

    const body = document.querySelector("body");
    body.appendChild(this.aside);
  }

  open() {
    this.aside.classList.remove("fr-hidden");
  }

  close() {
    const newValue = this.input.value;
    grist.setOption(this.name, newValue);
    this.value = newValue;
    this.aside.classList.add("fr-hidden");
    this.onClose();
  }
}

export default Configuration;
