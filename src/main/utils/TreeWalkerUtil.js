/**
 * @param {Node} root
 * @param {number} whatToShow
 * @param {(node: Node) => boolean} predicate
 */
export
function createTreeWalker(root, whatToShow, predicate) {
  // TODO: should check node !== root?
  const filter = node => (predicate(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)
  return document.createTreeWalker(root, whatToShow, filter)
}

/**
 * @param {TreeWalker[]} walkers
 */
export
function composeTreeWalkersUnion(...walkers) {
  let root = null
  let whatToShow = 0
  for (const walker of walkers) {
    // NOTE: Element#contains method cannot work across shadow trees
    if (!root || root.contains(walker.root)) {
      root = walker.root
    } else {
      throw new Error('incompatible with root of walkers')
    }
    whatToShow |= walker.whatToShow
  }

  return document.createTreeWalker(root, whatToShow, node => {
    if (node === root) {
      return NodeFilter.FILTER_SKIP
    }

    let skip = false
    for (const walker of walkers) {
      const result = walker.filter(node)
      if (result === NodeFilter.FILTER_ACCEPT) {
        return NodeFilter.FILTER_ACCEPT
      }

      if (result === NodeFilter.FILTER_SKIP) {
        skip = true
      }
    }
    if (skip) {
      return NodeFilter.FILTER_SKIP
    }
    return NodeFilter.FILTER_REJECT
  })
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function nodeBefore(walker, range) {
  const { startContainer: container, startOffset: offset } = range
  let mayBeCurrent = true

  if (container.nodeType === document.ELEMENT_NODE) {
    if (offset < container.childNodes.length) {
      walker.currentNode = container.childNodes[offset]
      mayBeCurrent = false
    } else {
      walker.currentNode = container
      // skip the subtree of container
      do {
        if (!walker.lastChild()) {
          break
        }
      } while (true)
    }
  } else {
    walker.currentNode = container
    mayBeCurrent = false
  }

  // const currentNodeRange = document.createRange()
  // currentNodeRange.selectNode(walker.currentNode)
  // const mayBeCurrent = currentNodeRange.compareBoundaryPoints(Range.START_TO_START, range) < 0

  if (mayBeCurrent &&
    walker.filter(walker.currentNode) === NodeFilter.FILTER_ACCEPT) {
    return walker.currentNode
  }

  return walker.previousNode()
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function nodeAfter(walker, range) {
  const { endContainer: container, endOffset: offset } = range
  let mayBeCurrent = true

  if (container.nodeType === document.ELEMENT_NODE) {
    if (offset < container.childNodes.length) {
      walker.currentNode = container.childNodes[offset]
    } else {
      walker.currentNode = container
      // skip the sub tree of container
      do {
        if (!walker.lastChild()) {
          break
        }
      } while (true)
      mayBeCurrent = false
    }
  } else {
    walker.currentNode = container
    mayBeCurrent = false
  }

  if (mayBeCurrent &&
    walker.filter(walker.currentNode) === NodeFilter.FILTER_ACCEPT) {
    return walker.currentNode
  }

  return walker.nextNode()
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function* nodeIteratorWithin(walker, range) {
  const current = range.cloneRange()
  current.collapse(false)

  do {
    const node = nodeBefore(walker, current)
    if (!node || !range.intersectsNode(node)) {
      break
    }

    current.setEndBefore(node)
    yield node
  } while (true)
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function* nodeExclusiveIteratorWithin(walker, range) {
  let last = null
  for (const node of nodeIteratorWithin(walker, range)) {
    if (node.contains(last)) {
      continue
    }
    yield node
    last = node
  }
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function nodeContains(walker, range) {
  const { commonAncestorContainer: node } = range

  if (walker.filter(node) === NodeFilter.FILTER_ACCEPT) {
    return node
  }

  walker.currentNode = node
  return walker.parentNode()
}

/**
 * @param {TreeWalker} walker
 * @param {Range} range
 */
export
function nodeContainedBy(walker, range) {
  if (range.collapsed) {
    return null
  }

  const caret = range.cloneRange()
  // const { startContainer: container, startOffset: offset } = caret
  // if (container.nodeType === document.TEXT_NODE && offset === 0) {
  //  caret.setStartBefore(caret.startContainer)
  // }
  caret.collapse(true)

  const node = nodeAfter(walker, caret)
  const nodeRange = document.createRange()
  if (node.nodeType === document.TEXT_NODE) {
    nodeRange.selectNodeContents(node)
  } else {
    nodeRange.selectNode(node)
  }

  return range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
}
