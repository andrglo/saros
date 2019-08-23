import {defaultMemoize as memoize} from 'reselect'
import {setCountries} from '../reducers/atlas'
import {getStore} from '../controller'
// import {LocalDate} from 'js-joda'
// import calc from 'date-easter'

export const getAtlasIsLoading = state => state.atlas.isLoading

let isLoading

export const getCountries = state => {
  const countries = state.atlas.countries
  if (!countries && !isLoading) {
    isLoading = true
    import('../loaders/atlas!').then(({default: atlas}) => {
      const data = atlas.countries
      const countries = []
      for (const key of Object.keys(data)) {
        countries.push({
          label: data[key].nativeName,
          value: key
        })
      }
      isLoading = false
      getStore().dispatch(setCountries({countries}))
    }) // if error do not retry => require page refresh
  }
  return countries
}

export const getStates = memoize(country => {
  const states = []
  // const data = hd.getStates(country)
  // if (!data) {
  //   return states
  // }
  // for (const key of Object.keys(data)) {
  //   states.push({
  //     label: data[key],
  //     value: key
  //   })
  // }
  return states
})

export const getCities = memoize((country, state) => {
  const cities = []
  // const data = hd.getRegions(country, state)
  // if (!data) {
  //   return cities
  // }
  // for (const key of Object.keys(data)) {
  //   cities.push({
  //     label: data[key],
  //     value: key
  //   })
  // }
  return cities
})
