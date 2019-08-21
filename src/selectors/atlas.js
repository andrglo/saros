import {defaultMemoize as memoize} from 'reselect'
import Holidays from '../lib/date-holidays'

// date-holidays is a build from https://github.com/commenthol/date-holidays with fewer countries

const hd = new Holidays()

let countries

export const getCountries = () => {
  if (!countries) {
    countries = []
    const data = hd.getCountries()
    for (const key of Object.keys(data)) {
      countries.push({
        label: data[key],
        value: key
      })
    }
  }
  return countries
}

export const getStates = memoize(country => {
  const states = []
  const data = hd.getStates(country)
  if (!data) {
    return states
  }
  for (const key of Object.keys(data)) {
    states.push({
      label: data[key],
      value: key
    })
  }
  return states
})

export const getCities = memoize((country, state) => {
  const cities = []
  const data = hd.getRegions(country, state)
  if (!data) {
    return cities
  }
  for (const key of Object.keys(data)) {
    cities.push({
      label: data[key],
      value: key
    })
  }
  return cities
})
