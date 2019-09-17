/* eslint-disable prefer-spread */
// copied from https://github.com/reduxjs/reselect due to be unmantained (v4 has bugs that are not fixed -> https://github.com/reduxjs/reselect/issues/376)

import memoizee from 'memoizee'

export const memoize = f =>
  memoizee(f, {
    maxAge: 1000 * 60 * 60, // 1m
    length: false
  })

const getDependencies = funcs => {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs

  if (!dependencies.every(dep => typeof dep === 'function')) {
    const dependencyTypes = dependencies
      .map(dep => typeof dep)
      .join(', ')
    throw new Error(
      'Selector creators expect all input-selectors to be functions, ' +
        `instead received the following types: [${dependencyTypes}]`
    )
  }

  return dependencies
}

export const createSelector = (...funcs) => {
  let recomputations = 0
  const resultFunc = funcs.pop()
  const dependencies = getDependencies(funcs)

  const memoizedResultFunc = memoize((...args) => {
    recomputations++
    // apply arguments instead of spreading for performance.
    return resultFunc.apply(null, args)
  })

  // If a selector is called with the exact same arguments we don't need to traverse our dependencies again.
  const selector = memoize((...args) => {
    const params = []
    const length = dependencies.length

    for (let i = 0; i < length; i++) {
      // apply arguments instead of spreading and mutate a local list of params for performance.
      params.push(dependencies[i].apply(null, args))
    }

    // apply arguments instead of spreading for performance.
    return memoizedResultFunc.apply(null, params)
  })

  selector.resultFunc = resultFunc
  selector.dependencies = dependencies
  selector.recomputations = () => recomputations
  selector.resetRecomputations = () => {
    recomputations = 0
  }
  return selector
}

export function createStructuredSelector(
  selectors,
  selectorCreator = createSelector
) {
  if (typeof selectors !== 'object') {
    throw new Error(
      'createStructuredSelector expects first argument to be an object ' +
        `where each property is a selector, instead received a ${typeof selectors}`
    )
  }
  const objectKeys = Object.keys(selectors)
  return selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
}
