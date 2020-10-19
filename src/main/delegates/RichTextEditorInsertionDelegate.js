import { isLinebreak, isBlockElement, isContent, nodeLength, closest } from '../utils/DOMUtil.js'
import { endOfRange, extendEnd, alignTo } from '../utils/RangeUtil.js'
import { nodeBefore } from '../utils/TreeWalkerUtil.js'
import CaretWalker from '../helpers/CaretWalker.js'
import RangeRegulator from '../helpers/RangeRegulator.js'
import Delegate from './Delegate.js'

export default
class RichTextEditorInsertionDelegate extends Delegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
    this._caretWalker = new CaretWalker(coordinator)
    this._regulator = new RangeRegulator(coordinator)
  }

  shouldIntercept(event, mode) {
    const { type } = mode
    return type === 'insert'
  }

  intercept(event, mode) {
    const regulator = this._regulator
    const { range, name, data } = mode
    const { collapsed } = range

    regulator.adjustToContentOuterRange(range)

    if (!collapsed) {
      this.deleteContents(range)
      this.collapseLines(range)
    }

    if (name === 'printable-char') {
      regulator.adjustToContentInnerRange(range)
    }

    const caret = range
    if (name === 'break-paragraph') {
      this.insertNewLine(caret)
    } else
    if (name === 'break-line') {
      this.insertLinebreak(caret)
    } else
    if (name === 'backspace') {
      if (collapsed) {
        this.deleteChar(caret)
      }
    } else
    if (name === 'printable-char') {
      console.assert(data)
      this.insertChar(caret, data)
    }
  }

  deleteContents(range) {
    range.deleteContents()
  }

  collapseLines(caret) {
    console.assert(caret.collapsed)
    const { startContainer: container, startOffset: offset } = caret
    let prev = container.childNodes[offset - 1]
    let next = container.childNodes[offset]
    if (prev && isBlockElement(prev)) {
      if (this.isCollapsedBlock(prev)) {
        prev.remove()
        prev = null
      }
    }
    if (next && isBlockElement(next)) {
      if (this.isCollapsedBlock(next)) {
        next.remove()
        next = null
      }
    }

    const crossLines = prev && next

    if (crossLines) {
      const collapsePoint = new Range()
      if (isBlockElement(prev)) {
        collapsePoint.setStart(prev, nodeLength(prev))
      } else {
        collapsePoint.setStartAfter(prev)
      }
      collapsePoint.collapse(true)

      const nextRange = new Range()
      if (isBlockElement(next)) {
        nextRange.selectNodeContents(next)
      } else {
        nextRange.setStartBefore(next)
        nextRange.setEnd(container, nodeLength(container))
      }
      const nextContent = nextRange.extractContents()
      collapsePoint.insertNode(nextContent)

      if (isBlockElement(next)) {
        next.remove()
      }

      alignTo(caret, Range.START_TO_END, collapsePoint)
    }
  }

  /** @param {Range} caret */
  insertNewLine(caret) {
    console.assert(caret.collapsed)
    const { commonAncestorContainer: ancestor } = caret
    const block = closest(ancestor, isBlockElement)
    const { target } = this._coordinator
    if (block === target) {
      const linebreak = document.createElement('br')
      caret.insertNode(linebreak)
      caret.collapse(false)
      return
    }

    const headRange = caret.cloneRange()
    headRange.setStartBefore(block)
    const content = headRange.extractContents()
    headRange.insertNode(content)
    const { endContainer: container, endOffset: offset } = headRange
    const prev = container.childNodes[offset - 1]
    const next = container.childNodes[offset]

    if (prev && isBlockElement(prev)) {
      if (this.isCollapsedBlock(prev)) {
        const blankLinePlaceholder = document.createElement('br')
        // start.insertNode(blankLinePlaceholder)
        prev.append(blankLinePlaceholder)
      }
    }
    if (next && isBlockElement(next)) {
      if (this.isCollapsedBlock(next)) {
        const blankLinePlaceholder = document.createElement('br')
        caret.insertNode(blankLinePlaceholder)
        caret.collapse(true)
      }
    }
  }

  /** @param {Range} caret */
  insertLinebreak(caret) {
    console.assert(caret.collapsed)
    const linebreak = document.createElement('br')
    caret.insertNode(linebreak)
    caret.collapse(false)

    const line = caret.cloneRange()
    const { blockWalker } = this._coordinator
    extendEnd(line, blockWalker, isLinebreak)
    if (this.isCollapsedLineRange(line)) {
      const blankLinePlaceholder = document.createElement('br')
      line.insertNode(blankLinePlaceholder)
    }
  }

  deleteChar(caret) {
    console.assert(caret.collapsed)
    const caretWalker = this._caretWalker
    const prevCaret = caretWalker.prevCaret(caret)
    if (!prevCaret) {
      return
    }

    const range = caret
    alignTo(range, Range.START_TO_START, prevCaret)
    this.deleteContents(range)
    this.collapseLines(range)
  }

  insertChar(caret, char) {
    console.assert(caret.collapsed)
    caret.insertNode(new Text(char))
    caret.collapse(false)
  }

  /** @param {Node} block */
  isCollapsedBlock(block) {
    const { contentWalker } = this._coordinator
    contentWalker.currentNode = block
    const content = contentWalker.firstChild()
    return !content
  }

  /** @param {Range} range */
  isCollapsedLineRange(range) {
    const { contentWalker } = this._coordinator

    const end = endOfRange(range)
    const { endContainer } = end
    console.assert(!isContent(endContainer))

    const node = nodeBefore(contentWalker, end)
    console.assert(node)
    // no inline content contained
    return !range.intersectsNode(node)
  }
}
