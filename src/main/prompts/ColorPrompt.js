import Prompt from './Prompt.js'

export default
class ColorPrompt extends Prompt {
  static PROMPT_ID = 'prompt-color'

  static PROMPT_FIELD = 'color'

  async getResult() {
    const formData = await super.getResult()
    return formData.get(ColorPrompt.PROMPT_FIELD)
  }

  render() {
    const html = (
      `<dialog id="${ColorPrompt.PROMPT_ID}">
        <form method="dialog">
          <label for="${ColorPrompt.PROMPT_FIELD}">Select A Color: </label>
          <input type="color" name="${ColorPrompt.PROMPT_FIELD}" autofocus="">
          <menu>
            <button type="submit" name="confirm">submit</button>
          </menu>
        </form>
      </dialog>`
    )
    const shadowRoot = this._root.getRootNode()
    this._root.insertAdjacentHTML('afterend', html)
    const dialog = shadowRoot.getElementById(ColorPrompt.PROMPT_ID)

    return dialog
  }
}
