import { isLinebreak, isNonEmptyText, isInlineEmbeded } from './DOMUtil.js'
import { nodeBefore, nodeAfter } from './TreeWalkerUtil.js'
import { startOfRange, endOfRange, isEqualRange, extendStart, extendEnd, caretPosition } from './RangeFactory.js'

export default
class CaretWalker {
  constructor(coordinator) {
    this._coordinator = coordinator
  }

  /** @param {Range} caret */
  prevCaret(caret) {
    console.assert(caret.collapsed)
    caret = caret.cloneRange()
    const { contentWalker, lineBoundaryWalker } = this._coordinator
    let reachedEnd = false

    do {
      const { startContainer: container, startOffset: offset } = caret
      if (isNonEmptyText(container) && offset > 0) {
        caret.setStart(container, offset - 1)
        break
      }

      const node = nodeBefore(contentWalker, caret)
      // console.log(node)
      if (!node) {
        reachedEnd = true
        break
      }

      const line = caret.cloneRange()
      extendStart(line, lineBoundaryWalker)
      // inLine is always false when isLinebreak(node)
      const inLine = line.intersectsNode(node)

      if (isNonEmptyText(node)) {
        if (inLine) {
          caret.setStart(node, node.length - 1)
        } else {
          caret.setStart(node, node.length)
        }
      } else
      if (isInlineEmbeded(node)) {
        if (inLine) {
          caret.setStartBefore(node)
        } else {
          caret.setStartAfter(node)
        }
      } else
      if (isLinebreak(node)) {
        // assert: !inLine
        caret.setStartBefore(node)
      }
    } while (0)

    if (reachedEnd) {
      return null
    }

    caret.collapse(true)
    return caret
  }

  /** @param {Range} caret */
  nextCaret(caret) {
    console.assert(caret.collapsed)
    caret = caret.cloneRange()
    const { contentWalker, lineBoundaryWalker } = this._coordinator
    let reachedEnd = false

    do {
      const { startContainer: container, startOffset: offset } = caret
      if (isNonEmptyText(container) && offset < container.length) {
        caret.setEnd(container, offset + 1)
        break
      }

      const node = nodeAfter(contentWalker, caret)
      // console.log(node)
      if (!node) {
        reachedEnd = true
        break
      }

      const line = caret.cloneRange()
      extendEnd(line, lineBoundaryWalker, isLinebreak)
      const inLine = line.intersectsNode(node)

      if (isNonEmptyText(node)) {
        if (inLine) {
          caret.setEnd(node, 1)
        } else {
          caret.setEnd(node, 0)
        }
      } else
      if (isInlineEmbeded(node)) {
        if (inLine) {
          caret.setEndAfter(node)
        } else {
          caret.setEndBefore(node)
        }
      } else
      if (isLinebreak(node)) {
        if (inLine) {
          caret.setEndAfter(node)
          caret.collapse(false)
          return this.nextCaret(caret)
        }
        caret.setEndBefore(node)
      }
    } while (0)

    if (reachedEnd) {
      return null
    }

    caret.collapse(false)
    return caret
  }

  /** @param {Range} caret */
  upperCaret(caret) {
    console.assert(caret.collapsed)
    const position = caretPosition(caret)
    let lastCaret, currentCaret = caret
    // current line
    do {
      lastCaret = currentCaret
      currentCaret = this.prevCaret(lastCaret)
      if (!currentCaret) {
        return lastCaret
      }

      const currentPosition = caretPosition(currentCaret)
      const lastPosition = caretPosition(lastCaret)
      const inUpperLine = currentPosition >= lastPosition
      if (inUpperLine) {
        break
      }
    } while (true)

    // console.log('upper line')

    // upper line
    do {
      lastCaret = currentCaret
      currentCaret = this.prevCaret(lastCaret)
      if (!currentCaret) {
        return lastCaret
      }

      const currentPosition = caretPosition(currentCaret)
      const lastPosition = caretPosition(lastCaret)
      const inUpperLine = currentPosition >= lastPosition
      if (inUpperLine) {
        currentCaret = lastCaret
        break
      }

      const currentOffset = Math.abs(currentPosition - position)
      const lastOffset = Math.abs(lastPosition - position)

      // console.log('last: %d = |%d - %d|', lastOffset, lastPosition, position)
      // console.log('current: %d = |%d - %d|', currentOffset, currentPosition, position)

      const reachedTargetCaret = currentOffset >= lastOffset
      if (reachedTargetCaret) {
        const overReached = currentOffset > lastOffset
        if (overReached) {
          currentCaret = lastCaret
        }
        return currentCaret
      }
    } while (true)

    return currentCaret
  }

  /** @param {Range} caret */
  lowerCaret(caret) {
    console.assert(caret.collapsed)
    const position = caretPosition(caret)
    let lastCaret, currentCaret = caret
    // current line
    do {
      lastCaret = currentCaret
      currentCaret = this.nextCaret(lastCaret)
      if (!currentCaret) {
        return lastCaret
      }

      const currentPosition = caretPosition(currentCaret)
      const lastPosition = caretPosition(lastCaret)
      const inLowerLine = currentPosition <= lastPosition
      if (inLowerLine) {
        break
      }
    } while (true)

    // console.log('lower line')

    // upper line
    do {
      lastCaret = currentCaret
      currentCaret = this.nextCaret(lastCaret)
      if (!currentCaret) {
        return lastCaret
      }

      const currentPosition = caretPosition(currentCaret)
      const lastPosition = caretPosition(lastCaret)
      const inLowerLine = currentPosition <= lastPosition
      if (inLowerLine) {
        currentCaret = lastCaret
        break
      }

      const currentOffset = Math.abs(currentPosition - position)
      const lastOffset = Math.abs(lastPosition - position)

      // console.log('last: %d = |%d - %d|', lastOffset, lastPosition, position)
      // console.log('current: %d = |%d - %d|', currentOffset, currentPosition, position)

      const reachedTargetCaret = currentOffset >= lastOffset
      if (reachedTargetCaret) {
        const overReached = currentOffset > lastOffset
        if (overReached) {
          currentCaret = lastCaret
        }
        return currentCaret
      }
    } while (true)

    return currentCaret
  }

  /**
   * @param {Range} caretA
   * @param {Range} caretB
   */
  isEquivalentCaret(caretA, caretB) {
    const { inlineBoundaryWalker } = this._coordinator
    const { startContainer, startOffset } = caretA
    const { endContainer, endOffset } = caretB
    /* eslint-disable-next-line yoda */
    const inMidText = (offset, text) => isNonEmptyText(text) && 0 < offset && offset < text.length
    if (inMidText(startOffset, startContainer) || inMidText(endOffset, endContainer)) {
      return endContainer === startContainer && endOffset === startOffset
    }

    caretA = caretA.cloneRange()
    if (isNonEmptyText(startContainer)) {
      if (startOffset === 0) {
        caretA.setEndBefore(startContainer)
      } else
      if (startOffset === startContainer.length) {
        caretA.setStartAfter(startContainer)
      }
    }

    caretB = caretB.cloneRange()
    if (isNonEmptyText(endContainer)) {
      if (endOffset === 0) {
        caretB.setEndBefore(endContainer)
      } else
      if (endOffset === endContainer.length) {
        caretB.setStartAfter(endContainer)
      }
    }

    extendStart(caretA, inlineBoundaryWalker, false)
    extendEnd(caretA, inlineBoundaryWalker, false)

    return (
      caretA.compareBoundaryPoints(Range.START_TO_START, caretB) <= 0 &&
      caretA.compareBoundaryPoints(Range.END_TO_END, caretB) >= 0
    )
  }

  distanceBetween(caretA, caretB) {
    const position = caretA.compareBoundaryPoints(Range.START_TO_START, caretB)
    if (position === 0) {
      return 0
    }
    if (position > 0) {
      return this.distanceBetween(caretB, caretA)
    }

    let offset = 0
    let current = caretA
    const end = caretB
    do {
      if (current.compareBoundaryPoints(Range.START_TO_START, end) >= 0) {
        break
      }
      const lastEnd = current
      current = this.nextCaret(current)
      offset += 1
      const reachedEnd = isEqualRange(current, lastEnd)
      if (reachedEnd) {
        break
      }
    } while (true)

    return offset
  }

  distanceBetweenRanges(range, how, sourceRange) {
    if (range.compareBoundaryPoints(how, sourceRange) === 0) {
      return 0
    }

    let caretA
    if (how === Range.START_TO_START || how === Range.END_TO_START) {
      caretA = startOfRange(range)
    } else {
      caretA = endOfRange(range)
    }

    let caretB
    if (how === Range.START_TO_START || how === Range.START_TO_END) {
      caretB = startOfRange(sourceRange)
    } else {
      caretB = endOfRange(sourceRange)
    }

    return this.distanceBetween(caretA, caretB)
  }
}
