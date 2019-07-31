import get from 'lodash/get'
import {subscribeCollection} from '../controller'

export const getCollection = (state, options) => {
  const {collection, ...rest} = options
  subscribeCollection(collection, rest)
  return get(state.doc, `${collection}.data`)
}

export const getDoc = (state, options) => {
  const {id} = options
  const data = getCollection(state, options)
  return data && id ? data[id] : data
}
