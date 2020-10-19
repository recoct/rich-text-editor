import { nodeExclusiveIteratorWithin, nodeIteratorWithin } from '../../utils/TreeWalkerUtil.js'

export default
class BlockStyleEffect {
  constructor(coordinator, strategy) {
    this._coordinator = coordinator
    this._strategy = strategy
  }

  applyTo(range) {
    // const { commonAncestorContainer } = range
    // commonAncestorContainer.normalize()

    const coordinator = this._coordinator
    const strategy = this._strategy
    const { blockWalker } = coordinator

    const blockCache = new Set()
    const maps = []
    for (const block of nodeExclusiveIteratorWithin(blockWalker, range)) {
      const setter = block.style
      const getter = window.getComputedStyle(block)
      const map = {
        get(key) {
          return getter[key]
        },
        set(key, value) {
          setter[key] = value
        },
        *keys() {
          yield* setter
        },
      }
      maps.push(map)
      blockCache.add(block)
    }

    strategy.transform(maps)

    const removed = new Set()
    for (const map of maps) {
      for (const key of map.keys()) {
        removed.add(key)
      }
    }
    // release
    maps.length = 0

    // remove redundant formats
    for (const block of nodeIteratorWithin(blockWalker, range)) {
      const setter = block.style
      const getter = window.getComputedStyle(block)
      if (blockCache.has(block)) {
        // normalize added styles of setter
        // sync inherited sytles of removed
        const keys = [ ...setter, ...removed ]
        for (const key of keys) {
          setter[key] = getter[key]
        }
      } else {
        // remove
        const keys = removed
        for (const key of keys) {
          setter[key] = null
        }
      }
    }
  }
}
