import InlineSemanticsEffect from './basics/InlineSemanticsEffect.js'
import { ToggleKeyedSetFormatStrategy } from './strategies/SetLikeFormatStrategy.js'

export
class ToggleBoldFormatEffect extends InlineSemanticsEffect {
  static FIELD_NAME = 'B'

  constructor(coordinator) {
    const key = ToggleBoldFormatEffect.FIELD_NAME
    const strategy = new ToggleKeyedSetFormatStrategy(key, true, true)
    super(coordinator, strategy)
  }
}

export
class ToggleItalicFormatEffect extends InlineSemanticsEffect {
  static FIELD_NAME = 'I'

  constructor(coordinator) {
    const key = ToggleItalicFormatEffect.FIELD_NAME
    const strategy = new ToggleKeyedSetFormatStrategy(key, true, true)
    super(coordinator, strategy)
  }
}

export
class ToggleUnderlineFormatEffect extends InlineSemanticsEffect {
  static FIELD_NAME = 'U'

  constructor(coordinator) {
    const key = ToggleUnderlineFormatEffect.FIELD_NAME
    const strategy = new ToggleKeyedSetFormatStrategy(key, true, true)
    super(coordinator, strategy)
  }
}

export
class ToggleLinkFormatEffect extends InlineSemanticsEffect {
  static FIELD_NAME = 'A'

  constructor(coordinator, href) {
    const key = ToggleLinkFormatEffect.FIELD_NAME
    const strategy = new ToggleKeyedSetFormatStrategy(key, true, true)
    super(coordinator, strategy)
    /** @Todo: find a proper way to add href attribute */
    this._href = href
    this._childEffects = [
      new ToggleBoldFormatEffect(coordinator),
      new ToggleUnderlineFormatEffect(coordinator),
    ]
  }

  /** @param {NamedNodeMap} attrs */
  setFormat(style, computedStyle, attrs) {
    const href = document.createAttribute('href')
    href.value = this._href
    const target = document.createAttribute('target')
    target.value = '_blank'
    attrs.setNamedItem(href)
    attrs.setNamedItem(target)

    style.textDecoration = 'none'
  }

  applyTo(range) {
    for (const effect of this._childEffects) {
      effect.applyTo(range)
    }
    super.applyTo(range)
  }
}
