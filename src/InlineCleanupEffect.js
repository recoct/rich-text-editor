import { dryrun } from './utils.js'
import { isFormatNode, isNonEmptyText, nodeLength, isSimliarNode } from './DOMUtil.js'
import { nodeExclusiveIteratorWithin, nodeIteratorWithin } from './TreeWalkerUtil.js'

export default
class InlineCleanupEffect {
  constructor(coordinator) {
    this._coordinator = coordinator
  }

  applyTo(range) {
    this.removeEmptyFormatNodes(range)
    this.removeStylessFormatNode(range)

    const coordinator = this._coordinator
    const { blockWalker } = coordinator
    for (const block of nodeExclusiveIteratorWithin(blockWalker, range)) {
      const blockRange = new Range()
      blockRange.selectNodeContents(block)
      this.mergeSimilarFormatNodes(blockRange)
    }
  }

  removeEmptyFormatNodes(range) {
    const { formatWalker } = this._coordinator

    for (const formatNode of nodeIteratorWithin(formatWalker, range)) {
      if (formatNode.childNodes.length === 0) {
        formatNode.remove()
      }
    }
  }

  removeStylessFormatNode(range) {
    const { formatWalker } = this._coordinator

    for (const formatNode of nodeIteratorWithin(formatWalker, range)) {
      // remove redundant styles which is equivalent to missing default value
      const setter = formatNode.style
      const getter = window.getComputedStyle(formatNode)
      const names = []
      for (const name of setter) {
        names.push(name)
      }
      for (const name of names) {
        const value = getter[name]
        const missingDefault = dryrun(getter, setter, name, null)
        if (value === missingDefault) {
          setter[name] = null
        }
      }

      const semanticsless = formatNode.tagName === 'SPAN'
      const styleless = setter.length === 0
      if (semanticsless && styleless) {
        formatNode.before(...formatNode.childNodes)
        formatNode.remove()
      }
    }
  }

  /** @param {Range} range */
  mergeSimilarFormatNodes(range, recursive = true) {
    const { startContainer, startOffset, endContainer, endOffset } = range
    // split out
    console.assert(startContainer === endContainer)
    if (isNonEmptyText(startContainer)) {
      return
    }

    const { childNodes } = startContainer
    const startSibling = childNodes[startOffset]
    const endSibling = childNodes[endOffset]

    let current = startSibling

    while (true) {
      if (!current || current === endSibling) {
        break
      }

      const next = current.nextSibling
      if (!next) {
        break
      }

      const isCurrentEligible = isFormatNode(current)
      if (!isCurrentEligible) {
        current = next
        continue
      }

      const isNextEligible = isFormatNode(next)
      const shouldMerge = isNextEligible && isSimliarNode(current, next)
      if (shouldMerge) {
        current.append(...next.childNodes)
        next.remove()
        continue
      }

      if (recursive) {
        const range = new Range()
        range.selectNodeContents(current)
        this.mergeSimilarFormatNodes(range)
      }

      if (isNextEligible) {
        console.assert(nodeLength(current) > 0)
        console.assert(nodeLength(next) > 0)
        current = next
      } else {
        current = next.nextSibling
      }
    }
  }
}
