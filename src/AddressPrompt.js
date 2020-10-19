import Prompt from './Prompt.js'

export default
class AddressPrompt extends Prompt {
  static PROMPT_ID = 'prompt-address'

  static PROMPT_FIELD = 'address'

  async getResult() {
    const formData = await super.getResult()
    return formData.get(AddressPrompt.PROMPT_FIELD)
  }

  render() {
    const html = (
      `<dialog id="${AddressPrompt.PROMPT_ID}">
        <form method="dialog">
          <label for="${AddressPrompt.PROMPT_FIELD}">Enter An Adress: </label>
          <input type="text" name="${AddressPrompt.PROMPT_FIELD}" autofocus="">
          <menu>
            <button type="submit" name="confirm">submit</button>
          </menu>
        </form>
      </dialog>`
    )
    const shadowRoot = this._root.getRootNode()
    this._root.insertAdjacentHTML('afterend', html)
    const dialog = shadowRoot.getElementById(AddressPrompt.PROMPT_ID)

    return dialog
  }
}
