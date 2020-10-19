import Prompt from './Prompt.js'

export default
class HeadingPrompt extends Prompt {
  static PROMPT_ID = 'prompt-heading'

  static PROMPT_FIELD = 'heading'

  async getResult() {
    const formData = await super.getResult()
    return formData.get(HeadingPrompt.PROMPT_FIELD)
  }

  render() {
    const html = (
      `<dialog id="${HeadingPrompt.PROMPT_ID}">
        <form method="dialog">
          <label for="${HeadingPrompt.PROMPT_FIELD}">Select A Heading Format: </label>
          <select name="${HeadingPrompt.PROMPT_FIELD}" autofocus="">
            <option value="h1">H1 一级标题</option>
            <option value="h2">H2 二级标题</option>
            <option value="h3">H3 三级标题</option>
            <option value="h4">H4 四级标题</option>
            <option value="h5">H5 五级标题</option>
            <option value="h6">H6 六级标题</option>
            <option value="p">P 正文</option>
          </select>
          <menu>
            <button type="submit" name="confirm">submit</button>
          </menu>
        </form>
      </dialog>`
    )
    const shadowRoot = this._root.getRootNode()
    this._root.insertAdjacentHTML('afterend', html)
    const dialog = shadowRoot.getElementById(HeadingPrompt.PROMPT_ID)

    return dialog
  }
}
