import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setUid = createAction('SET_UID')

const initialState = {
  uid: null
}

const actionHandlers = {
  [setUid]: (state, action) => ({
    ...state,
    uid: action.uid
  })
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'app',
    locallyOnly: true
  }
})
