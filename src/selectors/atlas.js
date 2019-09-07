import {createSelector, defaultMemoize as memoize} from 'reselect'
import get from 'lodash/get'
import {
  setCountries,
  setCountry,
  setHolidays
} from '../reducers/atlas'
import {getStore} from '../controller'
import {
  addDays,
  getEasterDate,
  extractYear,
  isWeekEnd
} from '../lib/date'

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
  getCountries,
  (state, {country}) => get(state, `atlas.${country}.states`),
  (state, {country}) => country,
  (countries = {}, data, code) => {
    if (!data && countries[code]) {
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
  getCountries,
  (state, {country, state: code}) =>
    get(state, `atlas.${country}.states[${code}].regions`),
  (state, {country}) => country,
  (countries = {}, data, code) => {
    if (!data && countries[code]) {
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

export const getHolidays = state => state.atlas.holidays

export const loadHolidays = async (holidays = {}, regions) => {
  try {
    if (isLoading.holidays) {
      return
    }
    holidays = {...holidays}
    for (const region of regions) {
      const {country, state, city} = region
      if (country && state && city) {
        // eslint-disable-next-line no-await-in-loop
        const data = await import(
          `../assets/atlas/${country}.json`
        ).catch(err => {
          console.error(err)
          // no data for this country yet
          return {}
        })
        if (data.holidays) {
          holidays[country] = data.holidays
        }
        const stateHolidays = get(data, `states.${state}.holidays`)
        if (stateHolidays) {
          holidays[`${country}/${state}`] = stateHolidays
        }
        holidays[`${country}/${state}/${city}`] =
          get(data, `states.${state}.regions.${city}.holidays`) || {}
      }
    }
    getStore().dispatch(setHolidays({holidays}))
  } catch (err) {
    console.error(err)
  }
  isLoading.holidays = false
}

const getYearHolidays = memoize((holidays, year) => {
  const yearHolidays = {}
  for (const region of Object.keys(holidays)) {
    const days = holidays[region]
    yearHolidays[region] = {}
    for (const monthDay of Object.keys(days)) {
      let date
      const match = monthDay.match(/^easter([+-]\d+)$/)
      if (match) {
        date = addDays(getEasterDate(year), Number(match[1]))
      } else {
        date = `${year}-${monthDay}`
      }
      yearHolidays[region][date] = days[monthDay]
    }
  }
  return yearHolidays
})

export const isBusinessDay = (date, region, holidays) => {
  try {
    if (isWeekEnd(date)) {
      return false
    }
    const yearHolidays = getYearHolidays(
      holidays,
      Number(extractYear(date))
    )
    const {country, state, city} = region
    if ((yearHolidays[country] || {})[date]) {
      return false
    }
    if ((yearHolidays[`${country}/${state}`] || {})[date]) {
      return false
    }
    if ((yearHolidays[`${country}/${state}/${city}`] || {})[date]) {
      return false
    }
  } catch (err) {
    console.error('isBusinessDay', {date, region, holidays}, err)
  }
  return true
}
