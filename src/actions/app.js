import history from '../lib/history'
import {setBrowserLocation} from '../reducers/app'

const makeLocationObject = location => {
  if (typeof location === 'string') {
    location = {
      pathname: location
    }
  }
  return location
}

export const pushBrowserLocation = location => {
  return dispatch => {
    location = makeLocationObject(location)
    history.push(location)
    dispatch(setBrowserLocation(location))
  }
}

export const replaceBrowserLocation = location => {
  return dispatch => {
    location = makeLocationObject(location)
    history.replace(location)
    dispatch(setBrowserLocation(location))
  }
}

export const goBackBrowserLocation = () => {
  return dispatch => {
    history.back()
    dispatch(setBrowserLocation(window.location))
  }
}
