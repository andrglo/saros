import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setUid = createAction('SET_UID')
export const setError = createAction('SET_ERROR')
export const clearError = createAction('CLEAR_ERROR')

const initialState = {
  uid: null
}

const actionHandlers = {
  [setUid]: (state, action) => ({
    ...state,
    uid: action.uid
  }),
  [setError]: (state, action) => ({
    ...state,
    error: action.error
  }),
  [clearError]: state => ({
    ...state,
    error: null
  })
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'app',
    omit: ['error'],
    locallyOnly: true
  }
})
