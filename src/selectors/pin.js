export const getPin = state => state.pin
export const getIsPinned = (state, {id}) => Boolean(state.pin[id])
