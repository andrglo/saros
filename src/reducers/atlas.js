import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setCountries = createAction('SET_COUNTRIES')
export const setCountry = createAction('SET_COUNTRY')
export const setHolidays = createAction('SET_HOLIDAYS')

const initialState = {}

const actionHandlers = {
  [setCountries]: (state, action) => ({
    ...state,
    countries: action.countries
  }),
  [setCountry]: (state, action) => ({
    ...state,
    [action.code]: action.data
  }),
  [setHolidays]: (state, action) => ({
    ...state,
    holidays: action.holidays
  })
}

export default createReducer(initialState, actionHandlers)
