import get from 'lodash/get'

export const getUser = state => state.app.user
export const getUid = state => get(state.app, 'user.uid')
export const getTheme = state => state.app.theme
export const getLocale = state =>
  state.app.locale ||
  (navigator.language.startsWith('pt') ? 'pt-BR' : 'en')
export const getBrowserLocation = state =>
  state.app.browserLocation || window.location
export const getUpdateAvailable = state => state.app.updateAvailable
