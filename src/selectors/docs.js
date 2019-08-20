import {createSelector} from 'reselect'
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

const transformDataToOptions = (data, labelKey) => {
  const options = []
  for (const key of Object.keys(data || {})) {
    const doc = data[key]
    options.push({
      label: doc[labelKey],
      value: key,
      doc
    })
  }
  return options
}

export const getCountries = state => {
  const collection = 'atlas/countries'
  return getCollection(state, {collection})
}

export const getCountriesAsOptions = createSelector(
  getCountries,
  countries => transformDataToOptions(countries, 'name')
)

export const getStates = (state, options) => {
  if (options.country) {
    const collection = `atlas/states/${options.country.toUpperCase()}/all`
    return getCollection(state, {collection})
  }
}

export const getStatesAsOptions = createSelector(
  getStates,
  states => transformDataToOptions(states, 'name')
)

export const getCities = (state, options) => {
  if (options.country && options.state) {
    const collection = `atlas/cities/${options.country.toUpperCase()}/${options.state.toUpperCase()}`
    return getCollection(state, {collection})
  }
}

export const getCitiesAsOptions = createSelector(
  getCities,
  cities => transformDataToOptions(cities, 'name')
)
