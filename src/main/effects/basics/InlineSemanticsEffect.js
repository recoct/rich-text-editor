import { isBlockElement, isContent } from '../../utils/DOMUtil.js'
import { nodeIteratorWithin } from '../../utils/TreeWalkerUtil.js'
import { iterateAll } from '../../utils/CollectionUtil.js'

export default
class InlineSemanticsEffect {
  constructor(coordinator, strategy) {
    this._coordinator = coordinator
    this._strategy = strategy
  }

  applyTo(range) {
    if (range.collapsed) {
      return
    }

    const { contentWalker, formatWalker } = this._coordinator
    const strategy = this._strategy

    const formatCache = new WeakSet()
    const contentCache = new Set()
    const sets = []
    for (const contentNode of nodeIteratorWithin(contentWalker, range)) {
      const set = getInlineCascadingTags(contentNode)
      sets.push(set)
      contentCache.add(contentNode)
    }

    const nextSets = []
    for (const set of sets) {
      nextSets.push(new Set(set))
    }

    strategy.transform(nextSets)

    const removed = new Set()
    for (const [ contentNode, currentSet, nextSet ] of iterateAll(contentCache, sets, nextSets)) {
      for (const item of currentSet) {
        if (!nextSet.has(item)) {
          removed.add(item)
        }
      }

      let tag = null
      for (const item of nextSet) {
        if (!currentSet.has(item)) {
          tag = item
          break
        }
      }

      const semanticsless = !tag || tag === 'SPAN'
      if (semanticsless) {
        continue
      }

      removed.add(tag)

      const formatNode = document.createElement(tag)
      contentNode.before(formatNode)
      formatNode.append(contentNode)
      formatCache.add(formatNode)
    }

    // remove redundant formats
    for (const formatNode of nodeIteratorWithin(formatWalker, range)) {
      if (formatCache.has(formatNode) || !removed.has(formatNode.tagName)) {
        continue
      }

      const setter = formatNode.style
      if (setter.length > 0) {
        const resemble = document.createElement('SPAN')
        for (const key of setter) {
          resemble.style[key] = setter[key]
        }
        formatNode.before(resemble)
        resemble.append(...formatNode.childNodes)
      } else {
        formatNode.before(...formatNode.childNodes)
      }
      formatNode.remove()
    }

    // release
    for (const set of sets) {
      set.clear()
    }
    sets.length = 0

    for (const set of nextSets) {
      set.clear()
    }
    nextSets.length = 0
  }
}

/** helper functions */

function getInlineCascadingTags(node) {
  if (isContent(node)) {
    node = node.parentNode
  }
  const cascadingTags = getCascadingTags(node, isBlockElement)
  cascadingTags.delete('SPAN')
  return cascadingTags
}

function getCascadingTags(node, end) {
  const cascadingTags = new Set()
  do {
    let shouldEnd = node === end
    if (typeof end === 'function') {
      shouldEnd = end(node)
    }
    if (shouldEnd) {
      break
    }

    cascadingTags.add(node.tagName)
    node = node.parentNode
  } while (true)

  return cascadingTags
}
