import React, {useLayoutEffect} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import {
  getForm,
  getFormValues,
  getFormInitialValues
} from '../selectors/forms'
import {getDoc} from '../selectors/docs'
import {setForm, mergeDocInFormValues} from '../reducers/forms'

// eslint-disable-next-line no-unused-vars
const log = debug('form')

export const FormContext = React.createContext()

const Form = props => {
  log('render', props)
  const {
    children,
    formName,
    className,
    descriptionFields,
    formHasValues,
    dispatch,
    onGetInitialValues,
    initialValues,
    doc,
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
    doc
  ])

  return (
    <FormContext.Provider value={formName}>
      <form {...rest} className={cn('', className)}>
        {children}
      </form>
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
  initialValues: PropTypes.object
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
    doc
  }
})(Form)
