import { nodeBefore, nodeAfter, nodeContains } from './TreeWalkerUtil.js'

/** @param {Node} node */
export
function rangeSelectingNode(node) {
  const range = new Range()
  range.selectNode(node)
  return range
}

/** @param {Node} node */
export
function rangeSelectingNodeContents(node) {
  const range = new Range()
  range.selectNodeContents(node)
  return range
}

/** @param {Range} range */
export
function startOfRange(range) {
  const caret = range.cloneRange()
  caret.collapse(true)
  return caret
}

/** @param {Range} range */
export
function endOfRange(range) {
  const caret = range.cloneRange()
  caret.collapse(false)
  return caret
}

/**
 * @param {Range} range
 * @param {number} how
 * @param {Range} sourceRange
 */
export
function alignTo(range, how, sourceRange) {
  switch (how) {
    case Range.START_TO_START:
      range.setStart(sourceRange.startContainer, sourceRange.startOffset)
      break
    case Range.START_TO_END:
      range.setEnd(sourceRange.startContainer, sourceRange.startOffset)
      break
    case Range.END_TO_END:
      range.setEnd(sourceRange.endContainer, sourceRange.endOffset)
      break
    case Range.END_TO_START:
      range.setStart(sourceRange.endContainer, sourceRange.endOffset)
      break
    default:
      console.assert(false, 'never')
  }
}

/**
 * @param {Range} range
 * @param {Range} caret
 */
export
function containsCaret(range, caret) {
  console.assert(caret.collapsed)
  return range.isPointInRange(caret.startContainer, caret.startOffset)
}

/**
 * @param {Range} rangeA
 * @param {Range} rangeB
 */
export
function contains(rangeA, rangeB) {
  return (
    rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) <= 0 &&
    rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB) >= 0
  )
}

/**
 * @param {Range} rangeA
 * @param {Range} rangeB
 */
export
function isEqualRange(rangeA, rangeB) {
  return (
    rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) === 0 &&
    rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB) === 0
  )
}

/**
 * @param {Range} rangeA
 * @param {Range} rangeB
 */
export
function intersect(rangeA, rangeB) {
  const range = new Range()
  if (rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) >= 0) {
    range.setStart(rangeA.startContainer, rangeA.startOffset)
  } else {
    range.setStart(rangeB.startContainer, rangeB.startOffset)
  }
  if (rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB) <= 0) {
    range.setEnd(rangeA.endContainer, rangeA.endOffset)
  } else {
    range.setEnd(rangeB.endContainer, rangeB.endOffset)
  }

  if (range.collapsed) {
    if (!containsCaret(rangeA, range) || !containsCaret(rangeB, range)) {
      return null
    }
  }

  return range
}

/**
 * @param {Range} range
 * @param {TreeWalker} walker
 * @param {boolean | (start: Node, contained: boolean) => boolean} outer
 */
export
function extendStart(range, walker, outer = false) {
  const { root } = walker

  const caret = range.cloneRange()
  caret.collapse(true)
  if (caret.startContainer.nodeType === document.TEXT_NODE) {
    caret.setStartBefore(caret.startContainer)
  }
  const nearest = nodeBefore(walker, caret)

  if (nearest) {
    const caretContained = range.intersectsNode(nearest)
    if (typeof outer === 'function') {
      outer = outer(nearest, caretContained)
    }

    if (caretContained) {
      /* eslint-disable-next-line  no-lonely-if */
      if (outer) {
        range.setStartBefore(nearest)
      } else {
        range.setStart(nearest, 0)
      }
    } else {
      /* eslint-disable-next-line  no-lonely-if */
      if (outer) {
        range.setStartBefore(nearest)
      } else {
        range.setStartAfter(nearest)
      }
    }
  } else {
    range.setStart(root, 0)
  }
}

/**
 * @param {Range} range
 * @param {TreeWalker} walker
 * @param {boolean | (end: Node, contained: boolean) => boolean} outer
 */
export
function extendEnd(range, walker, outer = false) {
  const { root } = walker

  const caret = range.cloneRange()
  caret.collapse(false)
  if (caret.endContainer.nodeType === document.TEXT_NODE) {
    caret.setEndAfter(caret.endContainer)
  }

  const container = nodeContains(walker, caret)
  const sibling = nodeAfter(walker, caret)
  const nearest = container && (!sibling || !container.contains(sibling)) ? container : sibling

  if (nearest) {
    const caretContained = nearest === container
    if (typeof outer === 'function') {
      outer = outer(nearest, caretContained)
    }

    if (caretContained) {
      /* eslint-disable-next-line  no-lonely-if */
      if (outer) {
        range.setEndAfter(nearest)
      } else {
        range.setEnd(nearest, nearest.childNodes.length)
      }
    } else {
      /* eslint-disable-next-line  no-lonely-if */
      if (outer) {
        range.setEndAfter(nearest)
      } else {
        range.setEndBefore(nearest)
      }
    }
  } else {
    range.setEnd(root, root.childNodes.length)
  }
}

/**
 * @param {Range} range
 * @param {(container: Node) => boolean} containerPredicate
 */
export
function extendStartToContainer(range, containerPredicate) {
  do {
    const { startContainer } = range
    if (containerPredicate(startContainer)) {
      break
    }
    range.setStartBefore(startContainer)
  } while (true)
}

/**
 * @param {Range} range
 * @param {(container: Node) => boolean} containerPredicate
 */
export
function extendEndToContainer(range, containerPredicate) {
  do {
    const { endContainer } = range
    if (containerPredicate(endContainer)) {
      break
    }
    range.setEndAfter(endContainer)
  } while (true)
}

/**
 * @param {Range} range
 * @param {(container: Node) => boolean} containerPredicate
 */
export
function extendStartToAdjacentContainer(range, containerPredicate) {
  do {
    const { startContainer, startOffset } = range
    if (startOffset > 0 || containerPredicate(startContainer)) {
      break
    }
    range.setStartBefore(startContainer)
  } while (true)
}

/**
 * @param {Range} range
 * @param {(container: Node) => boolean} containerPredicate
 */
export
function extendEndToAdjacentContainer(range, containerPredicate) {
  do {
    const { endContainer, endOffset } = range
    let { length } = endContainer.childNodes
    if (endContainer.nodeType === document.TEXT_NODE) {
      length = endContainer.length
    }
    if (endOffset < length || containerPredicate(endContainer)) {
      break
    }
    range.setEndAfter(endContainer)
  } while (true)
}

/**
 * @param {Range} sourceRange
 * @param {Range} separatorRange
 * @return {Range[]}
 */
export
function splitRange(sourceRange, separatorRange) {
  if (sourceRange.compareBoundaryPoints(Range.START_TO_START, separatorRange) > 0 ||
    sourceRange.compareBoundaryPoints(Range.END_TO_END, separatorRange) < 0) {
    return [ sourceRange ]
  }

  const { commonAncestorContainer: root } = sourceRange

  /* eslint-disable-next-line prefer-const */
  let { startContainer, startOffset } = sourceRange
  /* eslint-disable-next-line prefer-const */
  let { endContainer, endOffset } = sourceRange
  if (endContainer === root) {
    endOffset -= root.childNodes.length
  }

  const prevRange = new Range()
  prevRange.setStart(root, 0)
  prevRange.setEnd(separatorRange.startContainer, separatorRange.startOffset)
  const prevRangeContent = prevRange.extractContents()
  prevRange.insertNode(prevRangeContent)
  prevRange.setStart(startContainer, startOffset)
  sourceRange.setStart(startContainer, startOffset)

  const nextRange = new Range()
  nextRange.setStart(separatorRange.endContainer, separatorRange.endOffset)
  nextRange.setEnd(root, root.childNodes.length)
  const nextRangeContent = nextRange.extractContents()
  nextRange.insertNode(nextRangeContent)
  if (endContainer === root && endOffset <= 0) {
    endOffset += root.childNodes.length
  }
  nextRange.setEnd(endContainer, endOffset)
  sourceRange.setEnd(endContainer, endOffset)

  separatorRange.setStart(prevRange.endContainer, prevRange.endOffset)
  separatorRange.setEnd(nextRange.startContainer, nextRange.startOffset)

  return [ prevRange, nextRange ]
}

/** @param {Range} caret */
export
function caretPosition(caret) {
  console.assert(caret.collapsed)
  const { startContainer: container, startOffset: offset } = caret
  if (container.nodeType === document.TEXT_NODE) {
    return caret.getBoundingClientRect().left
  }

  if (container.childNodes.length > 0) {
    if (offset < container.childNodes.length) {
      const range = new Range()
      range.selectNode(container.childNodes[offset])
      const [ rect ] = range.getClientRects()
      return rect.left
    }

    const range = new Range()
    range.selectNode(container.childNodes[offset - 1])
    const rects = range.getClientRects()
    const rect = rects[rects.length - 1]
    return rect.right
  }

  const range = new Range()
  range.selectNode(container)
  const [ rect ] = range.getClientRects()
  return rect.left
}

export default 'RangeUtil'
