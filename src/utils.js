export
function* iterateAll(...iteratables) {
  const iterators = []
  for (const iteratable of iteratables) {
    const iterator = iteratable[Symbol.iterator]()
    iterators.push(iterator)
  }

  do {
    const output = []
    let allDone = true
    for (const iterator of iterators) {
      const { done, value } = iterator.next()
      if (!done) {
        allDone = false
      }
      output.push(value)
    }

    if (allDone) {
      break
    }

    yield output
  } while (true)
}

export
function sizeOf(collection) {
  if (Array.isArray(collection)) {
    return collection.length
  }

  if (typeof collection.size === 'number') {
    return collection.size
  }

  let size = 0
  /* eslint-disable-next-line no-unused-vars */
  for (const _ of collection) {
    size += 1
  }
  return size
}

export
function include(collection, searchElement) {
  const index = findIndex(collection, e => e === searchElement)
  return index >= 0
}

export
function findIndex(collection, predicate) {
  console.assert(typeof predicate === 'function')

  if (Array.isArray(collection)) {
    return collection.findIndex(predicate)
  }

  let i = 0, foundIndex = -1
  for (const item of collection) {
    const found = predicate(item)
    if (found) {
      foundIndex = i
      break
    }
    i += 1
  }

  return foundIndex
}

export
function findLastIndex(collection, predicate) {
  console.assert(typeof predicate === 'function')

  const array = []
  for (const item of collection) {
    array.unshift(item)
  }

  let foundIndex = array.findIndex(predicate)
  if (foundIndex >= 0) {
    foundIndex = array.length - 1 - foundIndex
  }
  return foundIndex
}

export
function getAt(collection, index) {
  if (Array.isArray(collection)) {
    return collection[index]
  }

  let i = 0, foundItem = null
  for (const item of collection) {
    if (i === index) {
      foundItem = item
      break
    }
    i += 1
  }
  return foundItem
}

export
function map(values, project) {
  const results = []
  for (const value of values) {
    results.push(project(value))
  }
  return results
}

const simpleCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
export
function getBounds(values, compare = simpleCompare) {
  let min, max
  let started = false
  for (const value of values) {
    if (!started) {
      started = true
      min = value
      max = value
      continue
    }

    if (compare(value, min) < 0) {
      min = value
    } else
    if (compare(value, max) > 0) {
      max = value
    }
  }

  return [ min, max ]
}

export
function dryrun(getter, setter, key, value) {
  if (typeof getter !== 'function') {
    const target = getter
    getter = key => target[key]
  }

  if (typeof setter !== 'function') {
    const target = setter
    setter = (key, value) => {
      target[key] = value
    }
  }

  const backup = getter(key)
  setter(key, value)
  const result = getter(key)
  setter(key, backup)
  return result
}
