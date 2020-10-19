import InlineStyleEffect from './InlineStyleEffect.js'
import { EnumerativeValuedMapFormatStrategy } from './MapLikeFormatStrategy.js'

export default
class FontColorFormatEffect extends InlineStyleEffect {
  static FILED_NAME = 'color'

  constructor(coordinator, color) {
    console.assert(color)
    const key = FontColorFormatEffect.FILED_NAME
    const strategy = new EnumerativeValuedMapFormatStrategy(key, [ color ], false, true)
    super(coordinator, strategy)
  }
}
