import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setCountries = createAction('SET_COUNTRIES')

const initialState = {}

const actionHandlers = {
  [setCountries]: (state, action) => ({
    ...state,
    countries: action.countries
  })
}

export default createReducer(initialState, actionHandlers)
