import history from '../lib/history'
import {setLocale, setBrowserLocation} from '../reducers/app'
import {fetchLocale} from '../lib/translate'

export const updateLocale = ({locale}) => {
  return dispatch =>
    fetchLocale(locale).then(changed => {
      if (changed) {
        dispatch(setLocale({locale}))
      }
    })
}

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
