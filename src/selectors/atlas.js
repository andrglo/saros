import {createSelector} from 'reselect'
import get from 'lodash/get'
import {setCountries, setCountry} from '../reducers/atlas'
import {getStore} from '../controller'
// import {LocalDate} from 'js-joda'
// import calc from 'date-easter'

export const getAtlasIsLoading = state => state.atlas.isLoading

const isLoading = {}

export const getCountries = createSelector(
  state => state.atlas.countries,
  countries => {
    if (!countries && !isLoading.countries) {
      isLoading.countries = true
      import('../assets/atlas/countries.json')
        .then(({default: data}) => {
          getStore().dispatch(setCountries({countries: data}))
        })
        .catch(err => {
          console.error(err)
        })
    }
    return countries
  }
)

export const getCountriesAsOptions = createSelector(
  getCountries,
  countries => {
    const options = []
    for (const key of Object.keys(countries || {})) {
      options.push({
        label: countries[key].nativeName,
        value: key
      })
    }
    return options
  }
)

const loadCountryData = code => {
  if (code && !isLoading[code]) {
    isLoading[code] = true
    import(`../assets/atlas/${code}.json`)
      .then(({default: data}) => {
        getStore().dispatch(setCountry({code, data}))
      })
      .catch(err => {
        console.error(err)
      })
  }
}

export const getStates = createSelector(
  (state, {country}) => get(state, `atlas.${country}.states`),
  (state, {country}) => country,
  (data, code) => {
    if (!data) {
      loadCountryData(code)
    }
    return data
  }
)

export const getStatesAsOptions = createSelector(
  getStates,
  states => {
    const options = []
    for (const key of Object.keys(states || {})) {
      options.push({
        label: states[key].name,
        value: key
      })
    }
    return options
  }
)

export const getCities = createSelector(
  (state, {country, state: code}) =>
    get(state, `atlas.${country}.states[${code}].regions`),
  (state, {country}) => country,
  (data, code) => {
    if (!data) {
      loadCountryData(code)
    }
    return data
  }
)

export const getCitiesAsOptions = createSelector(
  getCities,
  cities => {
    const options = []
    for (const key of Object.keys(cities || {})) {
      options.push({
        label: key,
        value: key
      })
    }
    return options
  }
)
