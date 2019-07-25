import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setUid = createAction('SET_UID')
export const setTheme = createAction('SET_THEME')
export const setLocale = createAction('SET_LOCALE')
export const setError = createAction('SET_ERROR')
export const clearError = createAction('CLEAR_ERROR')
export const setUpdateAvailable = createAction('SET_UPDATE_AVAILABLE')
export const clearUpdateAvailable = createAction(
  'CLEAR_UPDATE_AVAILABLE'
)

const initialState = {
  uid: null
}

const actionHandlers = {
  [setUid]: (state, action) => ({
    ...state,
    uid: action.uid
  }),
  [setTheme]: (state, action) => ({
    ...state,
    theme: action.theme
  }),
  [setLocale]: (state, action) => ({
    ...state,
    locale: action.locale
  }),
  [setError]: (state, action) => ({
    ...state,
    error: action.error
  }),
  [clearError]: state => ({
    ...state,
    error: null
  }),
  [setUpdateAvailable]: state => ({
    ...state,
    updateAvailable: true
  }),
  [clearUpdateAvailable]: state => ({
    ...state,
    updateAvailable: false
  })
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'app',
    omit: ['error', 'updateAvailable'],
    locallyOnly: true
  }
})
