import clone from 'lodash/cloneDeep'
import set from 'lodash/fp/set'
import get from 'lodash/fp/get'
import uniq from 'lodash/uniq'

import createReducer from '../lib/createReducer'
import createAction from '../lib/createAction'
import t from '../lib/translate'

export const setForm = createAction('SET_FORM')
export const setFormValues = createAction('SET_FORM_VALUES')
export const mergeDocInFormValues = createAction(
  'MERGE_DOC_IN_FORM_VALUES'
)

const initialState = {}

const setValues = (source, target = {}) => {
  target = clone(target)
  for (const path of Object.keys(source)) {
    set(path, source[path], target)
  }
  return Object.freeze(target)
}

const createForm = action => {
  let {title, descriptionFields = '', pathname, values = {}} = action
  values = setValues(values)
  return {
    initialValues: values,
    values,
    title,
    descriptionFields: descriptionFields.split(','),
    pathname,
    pristine: true,
    dirty: false
  }
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
  [mergeDocInFormValues]: (state, action) =>
    replaceForm(
      state,
      action,
      mergeValues(extractForm(state, action), action.doc)
    )
}

export default createReducer(initialState, actionHandlers, {
  persist: {
    path: 'forms',
    list: true,
    omit: [],
    locallyOnly: []
  }
})
