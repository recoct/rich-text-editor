import CompositeDelegate from './CompositeDelegate.js'

const SHIFT_KEY_FLAG = 0x01
const META_KEY_FLAG = 0x02
const CTRL_KEY_FLAG = 0x04
const ALT_KEY_FLAG = 0x08
const ALL_KEYS_MASK = 0x0f
const NONE_KEYS_MASK = 0x00

export default
class RichTextEditorModeDelegate extends CompositeDelegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
    this._modes = new Map()

    const MASK_OUT_SHIFT_KEY = ALL_KEYS_MASK & (~SHIFT_KEY_FLAG)
    this.registerNormalMode('left', 'ArrowLeft', 0x00, MASK_OUT_SHIFT_KEY)
    this.registerNormalMode('right', 'ArrowRight', 0x00, MASK_OUT_SHIFT_KEY)
    this.registerNormalMode('top', 'ArrowUp', 0x00, MASK_OUT_SHIFT_KEY)
    this.registerNormalMode('down', 'ArrowDown', 0x00, MASK_OUT_SHIFT_KEY)

    // this.registerEditMode('undo', 'KeyZ', META_KEY_FLAG)
    // this.registerEditMode('redo', 'KeyZ', SHIFT_KEY_FLAG | META_KEY_FLAG)

    this.registerInlineFormatMode('bold', 'KeyB', META_KEY_FLAG)
    this.registerInlineFormatMode('italic', 'KeyI', META_KEY_FLAG)
    this.registerInlineFormatMode('underline', 'KeyU', META_KEY_FLAG)
    this.registerInlineFormatMode('increase-fontsize', 'Equal', SHIFT_KEY_FLAG | META_KEY_FLAG)
    this.registerInlineFormatMode('decrease-fontsize', 'Minus', SHIFT_KEY_FLAG | META_KEY_FLAG)
    this.registerInlineFormatMode('color', 'KeyK', META_KEY_FLAG)
    this.registerInlineFormatMode('custom-1', 'Period', META_KEY_FLAG)
    this.registerInlineFormatMode('custom-2', 'Slash', META_KEY_FLAG)

    this.registerInlineFormatMode('increase-indent', 'BracketRight', META_KEY_FLAG)
    this.registerInlineFormatMode('decrease-indent', 'BracketLeft', META_KEY_FLAG)

    // this.registerBlockFormatMode('heading', 'KeyH', SHIFT_KEY_FLAG | META_KEY_FLAG)

    const regexp = /^(?:Key[A-Z]|Digit[0-9]|Minus|Equal|BracketLeft|BracketRight|Semicolon|Quote|Backquote|Backslash|Comma|Period|Slash|Space|Numpad[0-9]|Numpad(?:Add|Substract|Multiply|Divide|Equal|Comma|Decimal))$/
    this.registerInsertMode('printable-char', regexp)

    this.registerInsertMode('break-paragraph', 'Enter')
    this.registerInsertMode('break-line', 'Enter', SHIFT_KEY_FLAG)
    this.registerInsertMode('backspace', 'Backspace')
  }

  shouldIntercept(event) {
    const hasMode = this.modeFor(event) !== null
    return hasMode
  }

  async intercept(event) {
    const mode = this.modeFor(event)
    await super.intercept(event, mode)
  }

  modeFor(event) {
    const modes = this._modes
    for (const [ _, handler ] of modes) {
      const [ predicate, creator ] = handler
      if (predicate(event)) {
        return creator(event)
      }
    }
    console.warn('unsupported for:', eventDescription(event))
    return null
  }

  /**
   * @param {string} name
   * @param {(event: Event) => object} creator
   * @param {string | RegExp} pattern
   * @param {number} flags
   * @param {number} mask
   */
  registerMode(name, creator, pattern, flags = NONE_KEYS_MASK, mask = ALL_KEYS_MASK) {
    const modes = this._modes
    const predicate = getModePredicate(pattern, flags, mask)
    modes.set(name, [ predicate, creator ])
  }

  registerNormalMode(name, pattern, flags, mask) {
    const creator = getModeCreator(name, 'normal')
    this.registerMode(name, creator, pattern, flags, mask)
  }

  registerInlineFormatMode(name, pattern, flags, mask) {
    const creator = getModeCreator(name, 'command', 'format', 'inline')
    this.registerMode(name, creator, pattern, flags, mask)
  }

  registerBlockFormatMode(name, pattern, flags, mask) {
    const creator = getModeCreator(name, 'command', 'format', 'block')
    this.registerMode(name, creator, pattern, flags, mask)
  }

  registerEditMode(name, pattern, flags, mask) {
    const creator = getModeCreator(name, 'command', 'edit')
    this.registerMode(name, creator, pattern, flags, mask)
  }

  registerInsertMode(name, pattern, flags, mask) {
    // name = { 'char', 'newline', 'backspace' }
    const creator = getModeCreator(name, 'insert')
    this.registerMode(name, creator, pattern, flags, mask)
  }
}

function getModePredicate(pattern, flags, mask) {
  const checkType = event => event.type === 'keydown'

  let checkCode = null
  if (typeof pattern === 'string') {
    checkCode = event => event.code === pattern
  } else {
    checkCode = event => pattern.test(event.code)
  }

  const checkAuxKeys = event => {
    const { shiftKey, metaKey, ctrlKey, altKey } = event
    let bitmap = 0
    if (shiftKey) {
      bitmap |= SHIFT_KEY_FLAG
    }
    if (metaKey) {
      bitmap |= META_KEY_FLAG
    }
    if (ctrlKey) {
      bitmap |= CTRL_KEY_FLAG
    }
    if (altKey) {
      bitmap |= ALT_KEY_FLAG
    }

    return (bitmap & mask) === flags
  }

  return event => (
    checkType(event) &&
    checkCode(event) &&
    checkAuxKeys(event)
  )
}

function getModeCreator(name, type, subtype, context) {
  return event => {
    const data = event.data || event.key
    return { name, type, subtype, context, data, event, range: null }
  }
}

function eventDescription(event) {
  const keys = [ 'code', 'key', 'shiftKey', 'metaKey', 'ctrlKey', 'altKey' ]
  const pairs = []
  for (const key of keys) {
    let value = event[key]
    if (typeof value === 'string') {
      value = `"${value}"`
    }
    pairs.push([ key, value ])
  }
  const body = pairs.map(p => p.join(': ')).join(', ')
  const wrapped = `${event.type}{ ${body} }`
  return wrapped
}
