import BlockStyleEffect from './BlockStyleEffect.js'
import { AdditiveValuedMapFormatStrategy } from './MapLikeFormatStrategy.js'

export default
class IndentFormatEffect extends BlockStyleEffect {
  static FIELD_NAME = 'padding-left'

  constructor(coordinator, delta, min = '0px', max = '50%', uniform = true) {
    const key = IndentFormatEffect.FIELD_NAME
    const strategy = new AdditiveValuedMapFormatStrategy(key, delta, min, max, uniform)
    super(coordinator, strategy)
  }
}

export
class IncreaseIndentFormatEffect extends IndentFormatEffect {
  static DELTA = '+2ex'

  constructor(coordinator) {
    super(coordinator, IncreaseIndentFormatEffect.DELTA)
  }
}

export
class DecreaseIndentFormatEffect extends IndentFormatEffect {
  static DELTA = '-2ex'

  constructor(coordinator) {
    super(coordinator, DecreaseIndentFormatEffect.DELTA)
  }
}
