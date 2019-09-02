import clone from 'lodash/cloneDeep'
import set from 'lodash/fp/set'
import get from 'lodash/fp/get'
import uniq from 'lodash/uniq'

import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'
import t from '../lib/translate'

export const setForm = createAction('SET_FORM')
export const setFormValues = createAction('SET_FORM_VALUES')
export const setFormValueTyped = createAction('SET_FORM_VALUE_TYPED')
export const mergeDocInFormValues = createAction(
  'MERGE_DOC_IN_FORM_VALUES'
)
export const setFormFieldError = createAction('SET_FORM_FIELD_ERROR')
export const resetForm = createAction('RESET_FORM')
export const clearFormUndo = createAction('CLEAR_FORM_UNDO')
export const restoreFormUndo = createAction('RESTORE_FORM_UNDO')
export const lockForm = createAction('LOCK_FORM')

const initialState = {}

const setValues = (source, target = {}) => {
  for (const path of Object.keys(source)) {
    target = set(path, source[path], target)
  }
  return Object.freeze(target)
}

const createForm = action => {
  let {type, descriptionFields = '', values = {}, ...rest} = action
  values = setValues(values)
  return {
    ...rest,
    initialValues: values,
    values,
    descriptionFields: descriptionFields.split(','),
    dirty: false
  }
}

const clearForms = state => {
  for (const formName of Object.keys(state)) {
    if (state[formName].dirty !== true) {
      state = {...state}
      delete state[formName]
    }
  }
  return state
}

const extractForm = (state, action) => {
  const {formName} = action
  const form = state[formName] || {}
  return {...form}
}

const replaceForm = (state, action, form) => {
  const {formName} = action
  return {
    ...state,
    [formName]: form
  }
}

export const fixRowsReference = (op, fieldName, fields, index) => {
  const hasValues = !Array.isArray(fields)
  const names = hasValues ? Object.keys(fields) : fields
  const result = hasValues ? {} : []
  const insert = op === 'insert'
  const duplicate = op === 'duplicate'
  const move = insert || duplicate ? 1 : -1
  for (const oldName of names) {
    const match = oldName.match(
      new RegExp(`^${fieldName}\\[(\\d+)\\](.+)`)
    )
    let newName = oldName
    if (match) {
      const i = Number(match[1])
      if (i === index) {
        if (duplicate) {
          if (hasValues) {
            result[newName] = fields[oldName]
          } else {
            result.push(newName)
          }
        } else if (!insert) {
          continue
        }
      }
      if (i >= index) {
        newName = `${fieldName}[${i + move}]${match[2]}`
      }
    }
    if (hasValues) {
      result[newName] = fields[oldName]
    } else {
      result.push(newName)
    }
  }
  return result
}

const mergeValues = (form, refreshedValues) => {
  const merged = []
  let {changedByUser = [], fieldErrors = {}} = form
  const values = clone(form.values)
  const initialValues = clone(refreshedValues)
  changedByUser = [...changedByUser]
  fieldErrors = {...fieldErrors}

  const mergeValue = (rootKey, key, from, to) => {
    const getValue = get(key)
    const vFrom = getValue(from)
    const vTo = getValue(to)
    if (vFrom !== undefined && vFrom !== vTo) {
      if (!changedByUser.includes(rootKey)) {
        to[key] = vFrom
        delete fieldErrors[rootKey]
        changedByUser = changedByUser.filter(key => key !== rootKey)
      } else {
        merged.push({
          key: rootKey,
          value: vFrom
        })
      }
    }
  }

  const mergeObject = (key, from, to) => {
    uniq([...Object.keys(from), ...Object.keys(to)]).forEach(k => {
      const v = from[k] || to[k]
      const rootKey = `${key ? `${key}.` : ''}${k}`
      if (Array.isArray(v)) {
        to[k] = to[k] || []
        let i = 0
        while (to[k][i]) {
          mergeObject(rootKey, (from[k] || {})[i] || {}, to[k][i])
          i++
        }
        while (from[k][i]) {
          mergeObject(rootKey, from[k][i], {})
          i++
        }
      } else if (v && typeof v === 'object') {
        to[k] = to[k] || {}
        mergeObject(rootKey, from[k] || {}, to[k])
      } else {
        mergeValue(rootKey, k, from, to)
      }
    })
  }

  mergeObject('', refreshedValues, values)

  for (const {key, value} of merged) {
    fieldErrors[key] = t`Update conflict, now is` + ` "${value}"`
  }

  return {
    ...form,
    initialValues,
    values,
    changedByUser,
    fieldErrors
  }
}

const actionHandlers = {
  [setForm]: (state, action) => {
    state = clearForms(state)
    const {formName} = action
    return {
      ...state,
      [formName]: createForm(action)
    }
  },
  [setFormValues]: (state, action) => {
    const form = extractForm(state, action)
    form.values = setValues(action.values, form.values)
    return replaceForm(state, action, form)
  },
  [setFormValueTyped]: (state, action) => {
    const form = extractForm(state, action)
    const {id, value} = action
    form.values = set(id, value, form.values)
    if (!form.dirty) {
      form.editStartTime = Date.now()
    }
    form.dirty = true
    form.changedByUser = (form.changedByUser || []).includes(id)
      ? form.changedByUser
      : [...(form.changedByUser || []), action.id]
    return replaceForm(state, action, form)
  },
  [mergeDocInFormValues]: (state, action) =>
    replaceForm(
      state,
      action,
      mergeValues(extractForm(state, action), action.doc)
    ),
  [setFormFieldError]: (state, action) => {
    const form = extractForm(state, action)
    const error = Array.isArray(action.error)
      ? action.error.join('; ')
      : action.error
    if (error) {
      form.fieldErrors = {
        ...(form.fieldErrors || {}),
        [action.id]: error
      }
    } else {
      delete (form.fieldErrors || {})[action.id]
    }
    return replaceForm(state, action, form)
  },
  [resetForm]: (state, action) => {
    const form = extractForm(state, action)
    const nextForm = {
      ...form,
      values: clone(form.initialValues),
      dirty: false,
      lock: null,
      editStartTime: undefined,
      errors: undefined,
      fieldErrors: undefined,
      refreshedValues: undefined,
      undo: action.noUndo === true ? null : form, // no undo for example after form save
      changedByUser: [],
      cache: form.cacheInitialValues
        ? clone(form.cacheInitialValues)
        : {}
    }
    return replaceForm(state, action, nextForm)
  },
  [clearFormUndo]: (state, action) => {
    const form = extractForm(state, action)
    const nextForm = {
      ...form,
      undo: undefined
    }
    return replaceForm(state, action, nextForm)
  },
  [restoreFormUndo]: (state, action) => {
    const form = extractForm(state, action)
    const nextForm = form.undo
    return replaceForm(state, action, nextForm)
  },
  [lockForm]: (state, action) => {
    const form = extractForm(state, action)
    const nextForm = {
      ...form,
      lock: action.lock || null
    }
    return replaceForm(state, action, nextForm)
  }
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'forms',
    splitByProperty: true,
    omit: [],
    locallyOnly: []
  }
})
