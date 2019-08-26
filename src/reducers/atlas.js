import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setCountries = createAction('SET_COUNTRIES')
export const setCountry = createAction('SET_COUNTRY')

const initialState = {}

const actionHandlers = {
  [setCountries]: (state, action) => ({
    ...state,
    countries: action.countries
  }),
  [setCountry]: (state, action) => ({
    ...state,
    [action.code]: action.data
  })
}

export default createReducer(initialState, actionHandlers)
