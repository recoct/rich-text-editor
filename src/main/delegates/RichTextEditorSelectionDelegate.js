import { isBlockElement, nodeLength } from '../utils/DOMUtil.js'
import { startOfRange, endOfRange, alignTo } from '../utils/RangeUtil.js'
import RangeRegulator from '../helpers/RangeRegulator.js'
import CaretWalker from '../helpers/CaretWalker.js'
import Delegate from './Delegate.js'
import CompositeDelegate from './CompositeDelegate.js'

export default
class RichTextEditorSelectionDelegate extends CompositeDelegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator

    const selectionControlDelegate = new RichTextEditorSelectionControlDelegate(coordinator)
    const selectionAdjustDelegate = new RichTextEditorSelectionAdjustDelegate(coordinator)
    const selectionStoreDelegate = new RichTextEditorSelectionStoreDelegate(coordinator)

    super.add(selectionControlDelegate)
    super.add(selectionAdjustDelegate)
    selectionAdjustDelegate.add(selectionStoreDelegate)

    this._slot1 = selectionAdjustDelegate
    this._slot2 = selectionStoreDelegate
  }

  async intercept(event, mode) {
    const { root } = this._coordinator
    const selection = root.getSelection()
    console.assert(selection.rangeCount > 0)
    const range = selection.getRangeAt(0)

    mode.range = range
    // console.trace(mode)
    await super.intercept(event, mode)
    // forcedly update ranges in selection
    // in shadow case, updating range states does not reflect to the selection
    selection.removeAllRanges()
    selection.addRange(range)
  }

  add(delegate, cache = false) {
    const slot = cache ? this._slot2 : this._slot1
    slot.add(delegate)
  }

  remove(delegate, cache = false) {
    const slot = cache ? this._slot2 : this._slot1
    slot.remove(delegate)
  }
}

export
class RichTextEditorSelectionAdjustDelegate extends CompositeDelegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
    this._regulator = new RangeRegulator(coordinator)
  }

  shouldIntercept(event, mode) {
    const { type, subtype } = mode
    return type === 'insert' || type === 'command' && subtype === 'format'
  }

  async intercept(event, mode) {
    const { range } = mode
    const regulator = this._regulator

    regulator.normalize(range)
    regulator.adjustToContentInnerRange(range)

    await super.intercept(event, mode)

    regulator.adjustToContentInnerRange(range)
    regulator.normalize(range)
    // console.log(range)
  }
}

export
class RichTextEditorSelectionStoreDelegate extends CompositeDelegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
  }

  async intercept(event, mode) {
    const { range } = mode
    const snapshot = this.saveRange(range)
    await super.intercept(event, mode)
    this.restoreRange(range, snapshot)
  }

  // for dirty changes, i.e. content-consistent live-range-awareless changes
  saveRange(range) {
    const saved = range.cloneRange()
    const { startContainer, startOffset, endContainer, endOffset } = saved
    return { startContainer, startOffset, endContainer, endOffset }
  }

  restoreRange(range, saved) {
    const { startContainer, startOffset, endContainer, endOffset } = saved
    if (isBlockElement(startContainer) && startOffset > 0) {
      range.setStart(startContainer, nodeLength(startContainer))
    } else {
      range.setStart(startContainer, startOffset)
    }

    if (isBlockElement(endContainer) && endOffset > 0) {
      range.setEnd(endContainer, nodeLength(endContainer))
    } else {
      range.setEnd(endContainer, endOffset)
    }
  }
}

export
class RichTextEditorSelectionControlDelegate extends Delegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
    this._caretWalker = new CaretWalker(coordinator)
  }

  shouldIntercept(event, mode) {
    return mode.type === 'normal'
  }

  intercept(event, mode) {
    const { name, range } = mode
    switch (name) {
      case 'left':
        this.moveBefore(range, event.shiftKey)
        break
      case 'right':
        this.moveAfter(range, event.shiftKey)
        break
      case 'top':
        this.moveUp(range, event.shiftKey)
        break
      case 'down':
        this.moveDown(range, event.shiftKey)
        break
      default:
        console.assert(false, 'never')
    }
  }

  moveBefore(range, extend = true) {
    const caretWalker = this._caretWalker
    const caret = caretWalker.prevCaret(startOfRange(range))
    if (!caret) {
      return
    }

    alignTo(range, Range.START_TO_START, caret)
    if (!extend) {
      range.collapse(true)
    }
  }

  moveAfter(range, extend = true) {
    const caretWalker = this._caretWalker
    const caret = caretWalker.nextCaret(endOfRange(range))
    if (!caret) {
      return
    }

    alignTo(range, Range.END_TO_END, caret)
    if (!extend) {
      range.collapse(false)
    }
  }

  moveUp(range, extend = true) {
    const caretWalker = this._caretWalker
    const caret = caretWalker.upperCaret(startOfRange(range))
    if (!caret) {
      return
    }

    alignTo(range, Range.START_TO_START, caret)
    if (!extend) {
      range.collapse(true)
    }
  }

  moveDown(range, extend = true) {
    const caretWalker = this._caretWalker
    const caret = caretWalker.lowerCaret(endOfRange(range))
    if (!caret) {
      return
    }

    alignTo(range, Range.END_TO_END, caret)
    if (!extend) {
      range.collapse(false)
    }
  }
}
