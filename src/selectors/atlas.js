import {defaultMemoize as memoize} from 'reselect'
// import {LocalDate} from 'js-joda'
// import calc from 'date-easter'

import atlas from '../loaders/atlas!'

let countries

export const getCountries = () => {
  if (!countries) {
    countries = []
    const data = atlas.countries
    for (const key of Object.keys(data)) {
      countries.push({
        label: data[key].nativeName,
        value: key
      })
    }
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
