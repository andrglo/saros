import {subscribeCollection} from '../controller'

export const getCollection = (state, options) => {
  const {collection, ...rest} = options
  subscribeCollection(collection, rest)
  return (state.docs[collection] || {}).data
}

export const getDoc = (state, options) => {
  const {id} = options
  const data = getCollection(state, options)
  return data && id ? data[id] : data
}
