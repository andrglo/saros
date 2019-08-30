import {saveDocBatch} from '../controller'
import {getFormValues, getForm} from '../selectors/forms'

export const saveForm = ({formName, toBeDeleted, batch}) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const form = getForm(state, formName)
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
