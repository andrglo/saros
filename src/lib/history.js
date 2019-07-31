/* eslint-disable no-restricted-globals */
import qs from 'query-string'

const getPathname = location => {
  let pathname = location.pathname
  if (location.query) {
    pathname = `${pathname}?${qs.stringify(location.query)}`
  }
  return pathname
}

export const getQuery = location =>
  location.query || qs.parse(location.search)

const push = location =>
  history.pushState(
    location.state,
    location.title,
    getPathname(location)
  )

const replace = location =>
  history.replaceState(
    location.state,
    location.title,
    getPathname(location)
  )

export default {push, replace}
