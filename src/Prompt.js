export default
class Prompt {
  constructor(root) {
    /** @protected */
    this._root = root
    /** @protected */
    this._dialog = null
  }

  initialize() {
    if (!this._dialog) {
      this._dialog = this.render()
    }
  }

  /** @public */
  async getResult() {
    this.initialize()

    return new Promise((resolve, reject) => {
      const dialog = this._dialog
      const onclose = event => {
        dialog.removeEventListener('close', onclose, false)
        this._root.focus()
        if (!event.isTrusted) {
          resolve(null)
          return
        }
        // dialog.returnValue === form.confirm.value
        // resolve(dialog.returnValue)
        const form = dialog.querySelector('form')
        if (form) {
          resolve(new FormData(form))
        } else {
          reject(new Error('invalid prompt'))
        }
      }
      dialog.addEventListener('close', onclose, false)
      dialog.showModal()
      dialog.focus()
    })
  }
}
