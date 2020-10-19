/* eslint-disable class-methods-use-this */
export default
class Delegate {
  /** @param {Event} event */
  shouldIntercept(event) {
    return false
  }

  /** @param {Event} event */
  intercept(event, reserved) {
    event.preventDefault()
  }
}
