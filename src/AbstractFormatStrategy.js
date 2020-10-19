import { map, getBounds } from './utils.js'

export default
class AbstractFormatStrategy {
  static unify(values, preferUpperBound, augment, compare) {
    const [ min, max ] = getBounds(values, compare)
    let preferred = preferUpperBound ? max : min
    const even = min === max
    if (even) {
      preferred = augment(preferred)
    }

    return map(values, () => preferred)
  }

  static diversify(values, augment) {
    return map(values, augment)
  }

  transform(sources) {
    throw new Error('to be implemented')
  }
}
