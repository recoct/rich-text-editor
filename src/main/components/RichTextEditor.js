import RichTextEditorCoordinator from '../coordinator/RichTextEditorCoordinator.js'

export default
class RichTextEditor extends HTMLElement {
  constructor() {
    super()

    const root = this.attachShadow({ mode: 'open' /* ,delegatesFocus: true */ })
    root.innerHTML = this.markup
    const editable = root.querySelector('#editable')

    this._editable = editable
    this._coordinator = new RichTextEditorCoordinator(editable)
  }

  connectedCallback() {
    const editable = this._editable
    const coordinator = this._coordinator
    editable.onfocus = event => {
      editable.contentEditable = 'true'
    }

    editable.onblur = event => {
      editable.contentEditable = 'false'
    }

    editable.onkeydown = event => {
      if (!editable.isContentEditable) {
        return
      }

      if (coordinator.shouldIntercept(event)) {
        coordinator.intercept(event)
      }
    }
  }

  get markup() {
    return (`
      <div id="editable" contenteditable="true" tabindex="0">
        <p><br></p>
      </div>
      <style>
        :host>#editable {
          box-sizing: border-box;
          height: 100%;
          padding: 1em;
          line-height: 1.5em;
          overflow: auto;
          overflow-wrap: break-word;
          cursor: text;
        }
      </style>
    `)
  }
}
