/** @param {Node} node */
export
function isBlockElement(node) {
  return (
    node.nodeType === document.ELEMENT_NODE &&
    /^(?!inline)/.test(window.getComputedStyle(node).display)
  )
}

/** @param {Node} node */
export
function isLinebreak(node) {
  return /^br$/i.test(node.nodeName)
}

/** @param {Node} node */
export
function isNonEmptyText(node) {
  return node.nodeType === document.TEXT_NODE && node.length > 0
}

/** @param {Node} node */
export
function isInlineEmbeded(node) {
  return (
    /^(?:img|svg)$/i.test(node.nodeName) &&
    /^inline/i.test(window.getComputedStyle(node).display)
  )
}

/** @param {Node} node */
export
function isContent(node) {
  return isNonEmptyText(node) || isLinebreak(node) || isInlineEmbeded(node)
}

/** @param {Node} node */
export
function isTextWrapper(node) {
  return /^(?:span|a|b|i|u|em|strong|small|h1|h2|h3|h4|h5|h6)$/i.test(node.nodeName)
}

/** @param {Node} node */
export
function isFormatNode(node) {
  return /^(?:span|a|b|i|u|em|strong|small)$/i.test(node.nodeName)
}

/**
 * @param {Node} nodeA
 * @param {Node} nodeB
 */
export
function isSimliarNode(nodeA, nodeB) {
  const equalNodeType = nodeA.nodeType === nodeB.nodeType
  if (!equalNodeType) {
    return false
  }

  const isElement = nodeA.nodeType === document.ELEMENT_NODE
  if (!isElement) {
    return true
  }

  const equalName = nodeA.tagName === nodeB.tagName
  if (!equalName) {
    return false
  }

  const itemListA = nodeA.attributes
  const itemListB = nodeB.attributes
  if (itemListA.length !== itemListB.length) {
    return false
  }

  for (const itemA of itemListA) {
    const { name } = itemA
    const itemB = itemListB[name]
    const valueA = itemA.value
    const valueB = itemB.value
    if (valueA !== valueB) {
      return false
    }
  }

  return true
}

/** @param {Node} node */
export
function nodeLength(node) {
  return node.nodeType === document.TEXT_NODE ? node.length : node.childNodes.length
}

/** @param {Node} node */
export
function closest(node, predicate) {
  for (; node !== node.getRootNode(); node = node.parentNode) {
    if (predicate(node)) {
      break
    }
  }
  return node
}

/** @param {Node} node */
export
function matchTagName(node, tag) {
  return tag && tag.toLowerCase() === node.nodeName.toLowerCase()
}

export
function isEqualTagName(tagA, tagB) {
  return tagA && tagB && tagA.trim().toLowerCase() === tagB.trim().toLowerCase()
}

/** @param {Node} node */
export
function computeStyle(node, name) {
  let element = node
  if (isNonEmptyText(node)) {
    element = node.parentNode
  }
  return window.getComputedStyle(element)[name]
}

/** @param {Node} node */
export
function styleDryRun(node, name, value = '') {
  let element = node
  if (isNonEmptyText(node)) {
    element = node.parentNode
  }

  const styled = element.style.length > 0
  const backup = element.style[name]
  element.style[name] = value
  const computed = window.getComputedStyle(element)[name]
  element.style[name] = backup
  if (!styled) {
    element.removeAttribute('style')
  }

  return computed
}

/** @param {Node} node */
export
function isEqualStyle(referenceNode, name, valueA, valueB) {
  if (valueA === valueB) {
    return true
  }
  const computedA = styleDryRun(referenceNode, name, valueA)
  const computedB = styleDryRun(referenceNode, name, valueB)
  return computedA === computedB
}

/** @param {Node} node */
export
function matchOwnStyle(node, name, value) {
  let element = node
  if (isNonEmptyText(node)) {
    element = node.parentNode
  }

  const ownValue = element.style[name]
  return ownValue && (!value || isEqualStyle(element, name, ownValue, value))
}

/** @param {Node} node */
export
function matchStyle(node, name, value) {
  let element = node
  if (isNonEmptyText(node)) {
    element = node.parentNode
  }

  const ownValue = element.style[name]
  return isEqualStyle(element, name, ownValue, value)
}

/** @param {Element} element */
// matchOwnStyle(element, name, value) {
//  // console.assert(element.nodeType === document.ELEMENT_NODE)
//  if (value && value === element.style[name] || element.style[name]) {
//    return true
//  }
//  if (element.tagName.toLowerCase() !== 'span') {
//    const currentStyle = window.getComputedStyle(element)[name]
//    // console.assert(element.parentElement)
//    const parentStyle = window.getComputedStyle(element.parentElement)[name]
//    const inherited = currentStyle === parentStyle
//    if (!value) {
//      return !inherited
//    }
//    const expectedStyle = computeStyle({ [name]: value })[name]
//    return !inherited && currentStyle === expectedStyle
//  }
//  return false
// }

export default 'DOMUtil'
