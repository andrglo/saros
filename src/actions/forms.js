import kebabCase from 'lodash/kebabCase'

import normalize from '../lib/normalize'
import {saveDocBatch} from '../controller'
import {getFormValues, getForm} from '../selectors/forms'
import history from '../lib/history'
import {setBrowserLocation} from '../reducers/app'

export const openForm = (file, id) => async dispatch => {
  const parts = file.split('/')
  const lastIndex = parts.length - 1
  parts[lastIndex] = normalize(kebabCase(parts[lastIndex]))
  const location = {
    pathname: `/${parts.join('/')}`,
    query: {
      id
    }
  }
  history.push(location)
  dispatch(setBrowserLocation(location))
}

export const saveForm = ({formName, toBeDeleted, batch}) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const form = getForm(state, {formName})
  const {collection: path, id} = form
  await saveDocBatch([
    {
      path,
      id,
      doc: getFormValues(form),
      options: {form: [formName, form], toBeDeleted}
    },
    ...(batch || [])
  ])
}
