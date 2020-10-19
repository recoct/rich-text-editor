import { isBlockElement, isNonEmptyText, isContent, nodeLength, closest } from '../utils/DOMUtil.js'
import { nodeBefore, nodeAfter } from '../utils/TreeWalkerUtil.js'
import { startOfRange, endOfRange, extendStart, extendEnd, extendStartToContainer, extendEndToContainer, extendStartToAdjacentContainer, extendEndToAdjacentContainer, alignTo } from '../utils/RangeUtil.js'

export default
class RangeRegulator {
  constructor(coordinator) {
    this._coordinator = coordinator
  }

  /** @param {Range} range */
  /* eslint-disable-next-line class-methods-use-this */
  normalize(range) {
    const { commonAncestorContainer } = range
    const block = closest(commonAncestorContainer, isBlockElement)
    block.normalize()
  }

  /**
   * @param {Range} caret
   * @param {'beforestart' | 'afterstart' | 'beforeend' | 'afterend'} where
   */
  adjustToInlineBoundarySide(caret, where) {
    console.assert(caret.collapsed)
    console.assert(where && /^(?:before|after)(?:start|end)$/i.test(where))
    const { inlineBoundaryWalker, blockWalker } = this._coordinator

    const { startContainer: container, startOffset: offset } = caret
    if (isNonEmptyText(container)) {
      const length = nodeLength(container)
      /* eslint-disable-next-line yoda */
      const midOfText = 0 < offset && offset < length
      if (midOfText) {
        container.splitText(offset)
      }
    }

    let prev = null, next = null

    if (isContent(container)) {
      const length = nodeLength(container)
      console.assert(offset === 0 || offset === length)
      if (offset === length) {
        prev = container
      }
      if (offset === 0) {
        next = container
      }
    }

    if (where === 'beforestart' || where === 'afterstart') {
      if (!prev) {
        prev = nodeBefore(inlineBoundaryWalker, caret)
      }
      console.assert(prev)
      if (isBlockElement(prev)) {
        caret.setEnd(prev, 0)
        console.assert(caret.collapsed)
        return
      }

      if (where === 'beforestart') {
        caret.setStart(prev, nodeLength(prev))
      } else {
        caret.setStartAfter(prev)
      }
      caret.collapse(true)
      return
    }

    if (where === 'beforeend' || where === 'afterend') {
      if (!next) {
        next = nodeAfter(inlineBoundaryWalker, caret)
      }

      if (!next || isBlockElement(next)) {
        const block = nodeBefore(blockWalker, caret)
        console.assert(block)
        caret.setStart(block, nodeLength(block))
        console.assert(caret.collapsed)
        return
      }

      if (where === 'beforeend') {
        caret.setEndBefore(next)
      } else {
        caret.setEnd(next, 0)
      }
      caret.collapse(false)
    }
  }

  /**
   * @param {Range} caret
   * @param {'beforestart' | 'afterstart' | 'beforeend' | 'afterend'} where
   */
  adjustToContentSide(caret, where) {
    console.assert(caret.collapsed)
    const contraWhere = where.replace(/(start)|(end)/, (m, p1, p2) => (p1 ? 'end' : p2 ? 'start' : m))
    this.adjustToInlineBoundarySide(caret, contraWhere)
  }

  /** @param {Range} range */
  adjustToContentOuterRange(range) {
    const start = startOfRange(range)
    this.adjustToContentSide(start, 'beforestart')
    alignTo(range, Range.END_TO_START, start)

    const { collapsed } = range
    if (collapsed) {
      return
    }

    const end = endOfRange(range)
    this.adjustToContentSide(end, 'afterend')
    alignTo(range, Range.START_TO_END, end)
  }

  /** @param {Range} range */
  adjustToContentInnerRange(range) {
    // TODO:
    const { collapsed } = range
    if (collapsed) {
      const { startContainer: container, startOffset: offset } = range
      const atContentSide = offset === 0 || offset === nodeLength(container)
      if (atContentSide) {
        return
      }
    }

    const start = startOfRange(range)
    this.adjustToContentSide(start, 'afterstart')
    alignTo(range, Range.START_TO_START, start)

    if (collapsed || range.collapsed) {
      const { startContainer: container, startOffset: offset } = range
      const withinContent = isContent(container)
      const coveredContent = withinContent && offset === nodeLength(container)
      if (coveredContent) {
        range.setEndBefore(container)
      }
      return
    }

    const end = endOfRange(range)
    this.adjustToContentSide(end, 'beforeend')
    alignTo(range, Range.START_TO_END, end)
  }

  /** @param {Range} range */
  adjustToFormatRange(range) {
    this.adjustToContentOuterRange(range)

    const leading = startOfRange(range)
    extendStartToAdjacentContainer(leading, isBlockElement)

    const trailing = endOfRange(range)
    extendEndToAdjacentContainer(trailing, isBlockElement)

    alignTo(range, Range.START_TO_START, leading)
    alignTo(range, Range.END_TO_END, trailing)
  }

  /** @param {Range} range */
  /* eslint-disable-next-line class-methods-use-this */
  splitFormatRangeOutOfBlocks(range) {
    const start = startOfRange(range)
    extendStartToContainer(start, isBlockElement)
    // extract plus re-insert to split nodes at boundary point until the block container
    const startContents = start.extractContents()
    start.insertNode(startContents)
    // adjust range's start in case of partially selecting non-Text node
    range.setStart(start.endContainer, start.endOffset)

    const end = endOfRange(range)
    extendEndToContainer(end, isBlockElement)
    // extract plus re-insert to split nodes at boundary point until the block container
    const endContents = end.extractContents()
    end.insertNode(endContents)
    // adjust range's start in case of partially selecting non-Text node
    range.setEnd(end.startContainer, end.startOffset)
  }

  /** @param {Range} range */
  adjustToBlockRange(range) {
    const { blockWalker } = this._coordinator
    extendStart(range, blockWalker, (_, contained) => contained)
    extendEnd(range, blockWalker, (_, contained) => contained)
  }
}
