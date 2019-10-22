import {createSelector} from '../lib/reselect'

export const getForms = state => state.forms
export const getForm = (state, {formName}) => state.forms[formName]
export const getFormValues = form => form && form.values
export const getFormInitialValues = form => form && form.initialValues
export const getFieldErrors = form => form && form.fieldErrors
export const getFormIsDirty = form => form && form.dirty
export const getFormUndo = form => form && form.undo
export const getFormLock = form => form && form.lock

export const getDirtyForms = createSelector(
  getForms,
  () => window.location.pathname,
  (forms, pathname) => {
    const dirtyForms = []
    for (const formName of Object.keys(forms)) {
      const form = forms[formName]
      const formPathname =
        form.pathname && form.pathname.split('?')[0]
      if (getFormIsDirty(form) && formPathname !== pathname) {
        dirtyForms.push(formName)
      }
    }
    return dirtyForms
  }
)

export const makeFormName = (baseName, collection, id) =>
  `${baseName}#${collection}${id ? `/${id}` : ''}`
