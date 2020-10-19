import { iterateAll, map, findLastIndex } from '../../utils/CollectionUtil.js'
import AbstractFormatStrategy from './AbstractFormatStrategy.js'

export
class SingleKeySetFormatStrategy extends AbstractFormatStrategy {
  constructor(key, uniform) {
    super()
    this._key = key
    this._uniform = uniform
  }

  transform(sets) {
    const key = this._key
    const uniform = this._uniform
    const currentOns = map(sets, set => set.has(key))
    let nextOns
    if (uniform) {
      nextOns = this.unify(currentOns, sets)
    } else {
      nextOns = this.diversify(currentOns, sets)
    }

    for (const [ on, set ] of iterateAll(nextOns, sets)) {
      if (on) {
        set.add(key)
      } else {
        set.delete(key)
      }
    }
  }
}

export
class ToggleKeyedSetFormatStrategy extends SingleKeySetFormatStrategy {
  constructor(key, preferOn = true, uniform = false) {
    key = key.toUpperCase()
    super(key, uniform)
    this._preferOn = preferOn
  }

  unify(ons, sets) {
    // const someOn = this.some(sets, true)
    // const someOff = this.some(sets, false)
    let someOn = false
    let someOnAssigned = false
    let someOff = false
    let someOffAssigned = false
    for (const on of ons) {
      if (someOnAssigned && someOnAssigned) {
        break
      }
      if (on) {
        /* eslint-disable-next-line no-lonely-if */
        if (!someOnAssigned) {
          someOnAssigned = true
          someOn = true
        }
      } else {
        /* eslint-disable-next-line no-lonely-if */
        if (!someOffAssigned) {
          someOffAssigned = true
          someOff = true
        }
      }
    }

    const currentOn = this._preferOn ? someOn : !someOff
    const nextOn = !currentOn

    return map(ons, () => nextOn)
  }

  diversify(ons) {
    return map(ons, on => !on)
  }
}

export
class MutipleKeySetFormatStrategy extends AbstractFormatStrategy {
  constructor(candidates, uniform = false) {
    super()
    /** de-dupe and make randomly accessible */
    candidates = new Set(candidates)
    candidates = map(candidates, candidate => candidate.toUpperCase())
    this._candidates = candidates
  }
}

export
class EnumerativeKeyedSetFormatStrategy extends AbstractFormatStrategy {
  constructor(candidates, loop = true, uniform = false) {
    super()
    /** de-dupe and make randomly accessible */
    candidates = new Set(candidates)
    candidates = map(candidates, candidate => candidate.toUpperCase())
    this._candidates = candidates
    this._loop = loop
    this._uniform = uniform
  }

  transform(sets) {
    const uniform = this._uniform
    const candidates = this._candidates
    const indexes = this.resolveIndexes(sets)
    let newIndexes
    if (uniform) {
      newIndexes = this.unify(indexes)
    } else {
      newIndexes = this.diversify(indexes)
    }

    const candidateAt = index => this.candidateAt(index)
    const newValues = map(newIndexes, candidateAt)
    for (const [ value, set ] of iterateAll(newValues, sets)) {
      for (const candidate of candidates) {
        set.delete(candidate)
      }
      set.add(value)
    }
  }

  unify(indexes) {
    const preferUpperBound = true
    // if index is -1, reset it to 0, which is unified by index + 1
    const augment = index => index + 1

    return AbstractFormatStrategy.unify(indexes, preferUpperBound, augment)
  }

  diversify(indexes) {
    // if index is -1, reset it to 0, which is unified by index + 1
    const augment = index => index + 1

    return AbstractFormatStrategy.diversify(indexes, augment)
  }

  resolveIndexes(collections) {
    const candidates = this._candidates
    const indexes = []
    for (const collection of collections) {
      const index = findLastIndex(candidates, candidate => collection.has(candidate))
      indexes.push(index)
    }

    return indexes
  }

  candidateAt(index) {
    console.assert(index >= 0)
    const candidates = this._candidates
    const loop = this._loop
    // normalize index
    const size = candidates.length
    if (loop) {
      index %= size
    } else
    if (index >= size) {
      index = size - 1
    }

    return candidates[index]
  }
}

export
class DirectKeyAssignedSetFormatStrategy extends AbstractFormatStrategy {
  constructor(sets) {
    super()
    this._sets = sets
    this._uniform = false
  }

  diversify() {
    return this._sets
  }
}
