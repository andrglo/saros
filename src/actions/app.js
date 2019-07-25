import {setLocale} from '../reducers/app'
import {fetchLocale} from '../lib/translate'

export const updateLocale = ({locale}) => {
  return dispatch =>
    fetchLocale(locale).then(changed => {
      if (changed) {
        dispatch(setLocale({locale}))
      }
    })
}
