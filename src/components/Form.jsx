import React, {
  useLayoutEffect,
  useCallback,
  useState,
  useEffect,
  useMemo
} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import {
  getForm,
  getFormValues,
  getFormInitialValues,
  getFormUndo
} from '../selectors/forms'
import {getDoc} from '../selectors/docs'
import {
  setForm,
  mergeDocInFormValues,
  clearFormUndo,
  restoreFormUndo,
  resetForm,
  lockForm
} from '../reducers/forms'
import {saveForm} from '../actions/forms'
import Alert from './Alert'
import t from '../lib/translate'
import {goBackBrowserLocation} from '../actions/app'

// eslint-disable-next-line no-unused-vars
const log = debug('form')

export const FormContext = React.createContext()

const Form = props => {
  // log('render', props)
  const {
    children,
    formName,
    className,
    descriptionFields,
    title,
    formHasValues,
    dispatch,
    onGetInitialValues,
    initialValues,
    doc,
    collection,
    id,
    undo,
    ...rest
  } = props

  useLayoutEffect(() => {
    let values = doc
    if (onGetInitialValues) {
      values = onGetInitialValues(values)
    }
    if (!formHasValues) {
      dispatch(
        setForm({
          formName,
          values,
          title,
          descriptionFields,
          collection,
          id,
          pathname: `${window.location.pathname}${window.location.search}`
        })
      )
    } else if (
      values &&
      initialValues &&
      ((values.updatedAt === 0 && initialValues.updatedAt !== 0) || // updatedAt is zero when the doc was saved in the local firebase cache but yet offline
        values.updatedAt > (initialValues.updatedAt || 0))
    ) {
      dispatch(mergeDocInFormValues({formName, doc: values}))
    }
  }, [
    dispatch,
    formHasValues,
    formName,
    onGetInitialValues,
    initialValues,
    doc,
    collection,
    id,
    title,
    descriptionFields
  ])

  const [unmounted, unmount] = useState(false)
  useEffect(() => () => unmount(true), [])
  const onSubmit = useCallback(
    event => {
      event.preventDefault()
      dispatch(lockForm({formName, lock: 'saving'}))
      dispatch(saveForm({formName}))
        .then(() => {
          if (!unmounted) {
            dispatch(goBackBrowserLocation())
          }
          dispatch(resetForm({formName, noUndo: true}))
        })
        .catch(err => {
          console.error(err)
          dispatch(lockForm({formName, lock: null}))
        })
    },
    [dispatch, formName, unmounted]
  )
  const onDelete = useCallback(
    event => {
      event.preventDefault()
      dispatch(
        lockForm({
          formName,
          lock: 'deleting'
        })
      )
      dispatch(saveForm({formName, toBeDeleted: true}))
        .then(() => {
          if (!unmounted) {
            dispatch(goBackBrowserLocation())
          }
          dispatch(resetForm({formName, noUndo: true}))
        })
        .catch(err => {
          console.error(err)
          dispatch(lockForm({formName, lock: null}))
        })
    },
    [dispatch, formName, unmounted]
  )
  const onReset = useCallback(
    event => {
      event.preventDefault()
      dispatch(resetForm({formName}))
    },
    [dispatch, formName]
  )
  const context = useMemo(
    () => ({
      formName,
      onDelete,
      onReset
    }),
    [formName, onDelete, onReset]
  )

  return (
    <FormContext.Provider value={context}>
      <form
        onSubmit={onSubmit}
        {...rest}
        className={cn('rounded border border-toolbar m-1', className)}
      >
        {children}
      </form>
      {undo && (
        <Alert
          type="warning"
          autoClose={10000}
          title={t`Changes canceled`}
          message={t`Redo?`}
          buttonCaption={t`Yes`}
          onClick={() => {
            dispatch(restoreFormUndo({formName}))
          }}
          onClose={() => {
            dispatch(clearFormUndo({formName}))
          }}
        />
      )}
    </FormContext.Provider>
  )
}

Form.propTypes = {
  className: PropTypes.string,
  formName: PropTypes.string.isRequired,
  descriptionFields: PropTypes.string,
  children: PropTypes.node.isRequired,
  formHasValues: PropTypes.bool.isRequired,
  doc: PropTypes.object,
  onGetInitialValues: PropTypes.func,
  dispatch: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  title: PropTypes.string,
  collection: PropTypes.string,
  id: PropTypes.string,
  undo: PropTypes.object
}

export default connect((state, props) => {
  const {formName, id, collection} = props
  const form = getForm(state, {formName})
  let doc

  if (collection) {
    doc =
      typeof collection === 'function'
        ? collection(state, {id})
        : getDoc(state, {id, collection})
  }
  return {
    initialValues: form && getFormInitialValues(form),
    formHasValues: Boolean(form && getFormValues(form)),
    undo: form && getFormUndo(form),
    doc
  }
})(Form)
