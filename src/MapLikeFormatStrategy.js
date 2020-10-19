/* eslint class-methods-use-this: [ "error", { "exceptMethods": [ "unify", "diversify" ] } ] */
import { iterateAll, findIndex, map, dryrun } from './utils.js'
import AbstractFormatStrategy from './AbstractFormatStrategy.js'

export
class SingleKeyedMapFormatStrategy extends AbstractFormatStrategy {
  constructor(key, uniform = false) {
    super()
    this._key = key
    this._uniform = uniform
  }

  unify(values) {
    throw new Error('to be implemented')
  }

  diversify(values) {
    throw new Error('to be implemented')
  }

  transform(maps) {
    const key = this._key
    const uniform = this._uniform

    const oldValues = map(maps, m => m.get(key))
    const newValues = uniform ? this.unify(oldValues) : this.diversify(oldValues)

    for (const [ value, map ] of iterateAll(newValues, maps)) {
      map.set(key, value)
    }
  }
}

export
class AdditiveValuedMapFormatStrategy extends SingleKeyedMapFormatStrategy {
  constructor(key, delta, min, max, uniform = false) {
    console.assert(delta && parseFloat(delta))
    super(key, uniform)
    this._delta = delta
    this._min = min
    this._max = max
    this._increase = parseFloat(delta) > 0
  }

  unify(values) {
    const compare = (a, b) => parseFloat(a) - parseFloat(b)
    const preferUpperBound = this._increase
    const augment = value => this.augment(value)
    const clamp = value => this.clamp(value)

    const unified = AbstractFormatStrategy.unify(values, preferUpperBound, augment, compare)
    return map(unified, clamp)
  }

  diversify(values) {
    const augment = value => this.augment(value)
    const clamp = value => this.clamp(value)

    const diverse = AbstractFormatStrategy.diversify(values, augment)
    return map(diverse, clamp)
  }

  augment(value) {
    const delta = this._delta
    return `calc(${value} + ${delta})`
  }

  /**
   * @alternative
   * const clamp = value => {
   *   const clampedLowerBound = `max(${value}, ${this._min})`
   *   const clampedUpperBound = `min(${confinedLowerBound}, ${this._max})`
   *   return clampedUpperBound
   * }
   */
  clamp(value) {
    const min = this._min
    const max = this._max
    return `clamp(${min}, ${value}, ${max})`
  }
}

export
class EnumerativeValuedMapFormatStrategy extends SingleKeyedMapFormatStrategy {
  constructor(key, candidates, loop = true, uniform = false) {
    super(key, uniform)
    /** de-dupe and make randomly accessible */
    candidates = [ ...new Set(candidates) ]
    this._candidates = candidates
    this._loop = loop
  }

  transform(maps) {
    const key = this._key
    const uniform = this._uniform

    const oldIndexes = this.resolveIndexes(maps)
    const newIndexes = uniform ? this.unify(oldIndexes) : this.diversify(oldIndexes)

    const candidateAt = index => this.candidateAt(index)
    const newValues = map(newIndexes, candidateAt)

    for (const [ value, map ] of iterateAll(newValues, maps)) {
      map.set(key, value)
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

  resolveIndexes(maps) {
    const candidates = this._candidates
    const key = this._key
    const indexes = []
    for (const map of maps) {
      const getter = k => map.get(k)
      const setter = (k, v) => map.set(k, v)
      const index = findIndex(candidates, candidate => {
        const current = map.get(key)
        const found = current === dryrun(getter, setter, key, candidate)
        return found
      })
      indexes.push(index)
    }

    return indexes
  }
}

export
class DirectValueAssignedMapFormatStrategy extends SingleKeyedMapFormatStrategy {
  constructor(key, values) {
    super(key, false)
    this._values = values
  }

  diversify() {
    return this._values
  }
}
