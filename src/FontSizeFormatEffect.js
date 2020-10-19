import InlineStyleEffect from './InlineStyleEffect.js'
import { AdditiveValuedMapFormatStrategy } from './MapLikeFormatStrategy.js'

export default
class FontSizeFormatEffect extends InlineStyleEffect {
  static FIELD_NAME = 'font-size'

  // "12px" is the avaialable minimum font size in most of browsers
  // "32px" is the font size of <h1>
  constructor(coordinator, delta, min = '12px', max = '32px', uniform = true) {
    const key = FontSizeFormatEffect.FIELD_NAME
    const strategy = new AdditiveValuedMapFormatStrategy(key, delta, min, max, uniform)
    super(coordinator, strategy)
  }
}

export
class IncreaseFontSizeFormatEffect extends FontSizeFormatEffect {
  static FIELD_DELTA = '+2px'

  constructor(coordinator) {
    super(coordinator, IncreaseFontSizeFormatEffect.FIELD_DELTA)
  }
}

export
class DecreaseFontSizeFormatEffect extends FontSizeFormatEffect {
  static FIELD_DELTA = '-2px'

  constructor(coordinator) {
    super(coordinator, DecreaseFontSizeFormatEffect.FIELD_DELTA)
  }
}
