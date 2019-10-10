import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'

export const setIsPinned = createAction('SET_IS_PINNED')

const initialState = {}

const actionHandlers = {
  [setIsPinned]: (state, action) => ({
    ...state,
    [action.id]: action.pin
  })
}

export default createReducer(initialState, actionHandlers, {
  persist: true
})
