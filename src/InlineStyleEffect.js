import { isBlockElement } from './DOMUtil.js'
import { nodeIteratorWithin } from './TreeWalkerUtil.js'

export default
class InlineStyleEffect {
  constructor(coordinator, strategy) {
    this._coordinator = coordinator
    this._strategy = strategy
  }

  applyTo(range) {
    if (!checkRange(range)) {
      return
    }

    if (range.collapsed) {
      return
    }

    const { contentWalker, formatWalker } = this._coordinator
    const strategy = this._strategy

    const formatCache = new WeakSet()
    const maps = []
    for (const contentNode of nodeIteratorWithin(contentWalker, range)) {
      const formatNode = document.createElement('SPAN')
      contentNode.before(formatNode)
      formatNode.append(contentNode)
      const setter = formatNode.style
      const getter = window.getComputedStyle(formatNode)
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
      formatCache.add(formatNode)
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
    for (const formatNode of nodeIteratorWithin(formatWalker, range)) {
      if (formatNode.tagName !== 'SPAN') {
        continue
      }

      const setter = formatNode.style
      const getter = window.getComputedStyle(formatNode)
      if (formatCache.has(formatNode)) {
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

      if (setter.length === 0) {
        formatNode.before(...formatNode.childNodes)
        formatNode.remove()
      }
    }
  }
}

/** @param {Range} range */
function checkRange(range) {
  const { startContainer, endContainer, collapsed } = range
  // not split out of blocks yet
  return !collapsed && isBlockElement(startContainer) && isBlockElement(endContainer)
}
