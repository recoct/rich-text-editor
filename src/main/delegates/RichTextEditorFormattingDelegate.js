import {
  ToggleBoldFormatEffect,
  ToggleItalicFormatEffect,
  ToggleUnderlineFormatEffect
} from '../effects/ToggleEmphasizeTextFormatEffect.js'
import {
  IncreaseFontSizeFormatEffect,
  DecreaseFontSizeFormatEffect
} from '../effects/FontSizeFormatEffect.js'
import FontColorFormatEffect from '../effects/FontColorFormatEffect.js'
import {
  IncreaseIndentFormatEffect,
  DecreaseIndentFormatEffect
} from '../effects/IndentFormatEffect.js'
import InlineCleanupEffect from '../effects/InlineCleanupEffect.js'

import InlineStyleEffect from '../effects/basics/InlineStyleEffect.js'
import InlineSemanticsEffect from '../effects/basics/InlineSemanticsEffect.js'
// import BlockStyleEffect from './BlockStyleEffect.js'
import { EnumerativeKeyedSetFormatStrategy } from '../effects/strategies/SetLikeFormatStrategy.js'
import { EnumerativeValuedMapFormatStrategy } from '../effects/strategies/MapLikeFormatStrategy.js'

import RangeRegulator from '../helpers/RangeRegulator.js'

import Delegate from './Delegate.js'
import CompositeDelegate from './CompositeDelegate.js'

export default
class RichTextEditorFormattingDelegate extends CompositeDelegate {
  constructor(coordinator) {
    super()
    super.add(new RichTextEditorInlineFormattingDelegate(coordinator))
    super.add(new RichTextEditorBlockFormattingDelegate(coordinator))
  }

  add(delegate) {
    // do nothing
  }

  remove(delegate) {
    // do nothing
  }
}

class RichTextEditorBasicFormattingDelegate extends Delegate {
  constructor(coordinator) {
    super()
    this._coordinator = coordinator
    this._effects = new Map()
  }

  shouldIntercept(event, mode) {
    const { type, subtype, name } = mode
    const effects = this._effects
    return type === 'command' && subtype === 'format' && effects.has(name)
  }

  async intercept(event, mode) {
    const { range } = mode
    const effect = await this.selectEffect(event, mode)
    effect.applyTo(range)
  }

  registerEffect(name, effectOrLazyCreator) {
    const effects = this._effects
    effects.set(name, effectOrLazyCreator)
  }

  async selectEffect(event, mode) {
    const effects = this._effects
    const { name } = mode
    console.assert(effects.has(name))
    const effectOrLazyCreator = effects.get(name)
    if (typeof effectOrLazyCreator === 'function') {
      return effectOrLazyCreator(event, mode)
    }
    return effectOrLazyCreator
  }
}

export
class RichTextEditorInlineFormattingDelegate extends RichTextEditorBasicFormattingDelegate {
  constructor(coordinator) {
    super(coordinator)

    super.registerEffect('bold', new ToggleBoldFormatEffect(coordinator))
    super.registerEffect('italic', new ToggleItalicFormatEffect(coordinator))
    super.registerEffect('underline', new ToggleUnderlineFormatEffect(coordinator))
    super.registerEffect('increase-fontsize', new IncreaseFontSizeFormatEffect(coordinator))
    super.registerEffect('decrease-fontsize', new DecreaseFontSizeFormatEffect(coordinator))
    super.registerEffect('color', async (event, mode) => {
      const color = await coordinator.promptColor()
      return new FontColorFormatEffect(coordinator, color)
    })
    /** for test */
    super.registerEffect('custom-1', new InlineStyleEffect(coordinator, new EnumerativeValuedMapFormatStrategy('color', [ 'red', 'green', 'blue' ])))
    super.registerEffect('custom-2', new InlineSemanticsEffect(coordinator, new EnumerativeKeyedSetFormatStrategy([ 'b', 'i', 'u' ])))

    this._cleanup = new InlineCleanupEffect(coordinator)
    this._regulator = new RangeRegulator(coordinator)
  }

  async intercept(event, mode) {
    const { range } = mode
    if (range.collapsed) {
      return
    }

    this.prepare(event, mode)
    await super.intercept(event, mode)
    this.cleanup(event, mode)
  }

  prepare(event, mode) {
    const regulator = this._regulator
    const { range } = mode
    regulator.adjustToFormatRange(range)
    regulator.splitFormatRangeOutOfBlocks(range)
  }

  cleanup(event, mode) {
    const cleanup = this._cleanup
    const { range } = mode
    cleanup.applyTo(range)
  }
}

export
class RichTextEditorBlockFormattingDelegate extends RichTextEditorBasicFormattingDelegate {
  constructor(coordinator) {
    super(coordinator)

    super.registerEffect('increase-indent', new IncreaseIndentFormatEffect(coordinator))
    super.registerEffect('decrease-indent', new DecreaseIndentFormatEffect(coordinator))
    // super.registerEffect('heading', async (event, mode) => {
    //   const heading = await coordinator.promptHeading()
    //   return new BlockStyleEffect(coordinator, heading)
    // })
  }
}
