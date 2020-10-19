import Delegate from './Delegate.js'

export default
class CompositeDelegate extends Delegate {
  constructor() {
    super()
    /** @type {Set<Delegate>} */
    this._children = new Set()
  }

  /** @param {Delegate} delegate */
  add(delegate) {
    this._children.add(delegate)
  }

  /** @param {Delegate} delegate */
  remove(delegate) {
    this._children.remove(delegate)
  }

  clear(deep = false) {
    if (deep) {
      for (const child of this._children) {
        if (typeof child.clear === 'function') {
          child.clear(deep)
        }
      }
    }
    this._children.clear()
  }

  shouldIntercept(event, reserved) {
    for (const child of this._children) {
      if (child.shouldIntercept(event, reserved)) {
        return true
      }
    }
    return super.shouldIntercept(event, reserved)
  }

  async intercept(event, reserved) {
    console.log('[%s]', this.constructor.name)
    for (const child of this._children) {
      if (child.shouldIntercept(event, reserved)) {
        /* eslint-disable-next-line no-await-in-loop */
        await child.intercept(event, reserved)
      }
    }
    await super.intercept(event, reserved)
  }
}
