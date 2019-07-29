import get from 'lodash/get'

export const getUser = state => state.app.user
export const getUid = state => get(state.app, 'user.uid')
export const getTheme = state => state.app.theme
export const getLocale = state => state.app.locale
export const getBrowserLocation = state => state.app.browserLocation
export const getUpdateAvailable = state => state.app.updateAvailable
