import { isBlockElement, isLinebreak, isNonEmptyText, isInlineEmbeded, isFormatNode } from './DOMUtil.js'
import { createTreeWalker, composeTreeWalkersUnion } from './TreeWalkerUtil.js'
import CompositeDelegate from './CompositeDelegate.js'

import RichTextEditorModeDelegate from './RichTextEditorModeDelegate.js'
import RichTextEditorSelectionDelegate from './RichTextEditorSelectionDelegate.js'
import RichTextEditorInsertionDelegate from './RichTextEditorInsertionDelegate.js'
import RichTextEditorFormattingDelegate from './RichTextEditorFormattingDelegate.js'

import AddressPrompt from './AddressPrompt.js'
import ColorPrompt from './ColorPrompt.js'
import HeadingPrompt from './HeadingPrompt.js'

export default
class RichTextEditorCoordinator extends CompositeDelegate {
  static KEY_TEXT_WALKER = 1
  static KEY_LINEBREAK_WALKER = 2
  static KEY_EMBED_WALKER = 3
  static KEY_BLOCK_WALKER = 4
  static KEY_FORMAT_WALKER = 5

  static KEY_CONTENT_WALKER = 11
  static KEY_INLINE_WALKER = 12
  static KEY_LINE_BOUNDARY_WALKER = 13
  static KEY_INLINE_BOUNDARY_WALKER = 14

  static KEY_ADDRESS_PROMPT = 1
  static KEY_COLOR_PROMPT = 2

  static KEY_HEADING_PROMPT = 11

  static KEY_UNDO_DELEGATE = 1
  static KEY_MODE_DELEGATE = 2
  static KEY_SELECTION_DELEGATE = 3
  static KEY_INSERT_DELEGATE = 4
  static KEY_FORMAT_DELEGATE = 5
  static KEY_NORMALIZE_DELEGATE = 6
  static KEY_UNDO_PREPARE_DELEGATE = 7

  /** @param {Element} container */
  constructor(container) {
    super()
    this._container = container
    this._root = container.getRootNode()
    // alias
    const R = RichTextEditorCoordinator

    const basicWalkers = {
      [R.KEY_TEXT_WALKER]:
        createTreeWalker(container, NodeFilter.SHOW_TEXT, isNonEmptyText),
      [R.KEY_LINEBREAK_WALKER]:
        createTreeWalker(container, NodeFilter.SHOW_ELEMENT, isLinebreak),
      [R.KEY_EMBED_WALKER]:
        createTreeWalker(container, NodeFilter.SHOW_ELEMENT, isInlineEmbeded),
      [R.KEY_BLOCK_WALKER]:
        createTreeWalker(container, NodeFilter.SHOW_ELEMENT, isBlockElement),
      [R.KEY_FORMAT_WALKER]:
        createTreeWalker(container, NodeFilter.SHOW_ELEMENT, isFormatNode),
    }
    this._basicWalkers = basicWalkers

    const composedWalkers = {
      [R.KEY_CONTENT_WALKER]:
        composeTreeWalkersUnion(
          basicWalkers[R.KEY_TEXT_WALKER],
          basicWalkers[R.KEY_LINEBREAK_WALKER],
          basicWalkers[R.KEY_EMBED_WALKER]
        ),
      [R.KEY_INLINE_WALKER]:
        composeTreeWalkersUnion(
          basicWalkers[R.KEY_TEXT_WALKER],
          basicWalkers[R.KEY_LINEBREAK_WALKER],
          basicWalkers[R.KEY_EMBED_WALKER],
          basicWalkers[R.KEY_FORMAT_WALKER]
        ),
      [R.KEY_LINE_BOUNDARY_WALKER]:
        composeTreeWalkersUnion(
          basicWalkers[R.KEY_LINEBREAK_WALKER],
          basicWalkers[R.KEY_BLOCK_WALKER]
        ),
      [R.KEY_INLINE_BOUNDARY_WALKER]:
        composeTreeWalkersUnion(
          basicWalkers[R.KEY_TEXT_WALKER],
          basicWalkers[R.KEY_LINEBREAK_WALKER],
          basicWalkers[R.KEY_EMBED_WALKER],
          basicWalkers[R.KEY_BLOCK_WALKER]
        ),
    }
    this._composedWalkers = composedWalkers

    const prompts = {
      [R.KEY_ADDRESS_PROMPT]: new AddressPrompt(container),
      [R.KEY_COLOR_PROMPT]: new ColorPrompt(container),
      [R.KEY_HEADING_PROMPT]: new HeadingPrompt(container),
    }
    this._prompts = prompts

    const modeDelegate = new RichTextEditorModeDelegate(this)
    const selectionDelegate = new RichTextEditorSelectionDelegate(this)
    const insertionDelegate = new RichTextEditorInsertionDelegate(this)
    const formattingDelegate = new RichTextEditorFormattingDelegate(this)
    // const formattingDelegate = new RichTextEditorUndoableFormattingDelegate(this)

    super.add(modeDelegate)
    modeDelegate.add(selectionDelegate)
    selectionDelegate.add(insertionDelegate)
    selectionDelegate.add(formattingDelegate, true)
  }

  get root() {
    return this._root
  }

  get container() {
    return this._container
  }

  get target() {
    return this._container
  }

  /** walkers */
  get textWalker() {
    return this._basicWalkers[RichTextEditorCoordinator.KEY_TEXT_WALKER]
  }

  get linebreakWalker() {
    return this._basicWalkers[RichTextEditorCoordinator.KEY_LINEBREAK_WALKER]
  }

  get embedWalker() {
    return this._basicWalkers[RichTextEditorCoordinator.KEY_EMBED_WALKER]
  }

  get blockWalker() {
    return this._basicWalkers[RichTextEditorCoordinator.KEY_BLOCK_WALKER]
  }

  get formatWalker() {
    return this._basicWalkers[RichTextEditorCoordinator.KEY_FORMAT_WALKER]
  }

  get contentWalker() {
    return this._composedWalkers[RichTextEditorCoordinator.KEY_CONTENT_WALKER]
  }

  get inlineWalker() {
    return this._composedWalkers[RichTextEditorCoordinator.KEY_INLINE_WALKER]
  }

  get lineBoundaryWalker() {
    return this._composedWalkers[RichTextEditorCoordinator.KEY_LINE_BOUNDARY_WALKER]
  }

  get inlineBoundaryWalker() {
    return this._composedWalkers[RichTextEditorCoordinator.KEY_INLINE_BOUNDARY_WALKER]
  }

  async promptAddress() {
    const prompt = this._prompts[RichTextEditorCoordinator.KEY_ADDRESS_PROMPT]
    return prompt.getResult()
  }

  async promptColor() {
    const prompt = this._prompts[RichTextEditorCoordinator.KEY_COLOR_PROMPT]
    return prompt.getResult()
  }

  async promptHeading() {
    const prompt = this._prompts[RichTextEditorCoordinator.KEY_HEADING_PROMPT]
    return prompt.getResult()
  }
}
