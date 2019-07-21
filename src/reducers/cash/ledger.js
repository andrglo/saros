import createReducer from '../../lib/createReducer'
import createAction from '../../lib/createAction'

export const setUid = createAction('cash/SET_?')

const initialState = {
  info: null
}

const actionHandlers = {
  [setUid]: (state, action) => ({
    ...state,
    info: action.info
  })
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'ledger',
    locallyOnly: true
  }
})
