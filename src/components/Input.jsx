import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import get from 'lodash/get'
import debug from 'debug'

import {FormContext} from './Form'
import {
  getForm,
  getFormValues,
  getFieldErrors
} from '../selectors/forms'
import {setFormValueTyped, setFormFieldError} from '../reducers/forms'

const log = debug('input')

const Input = props => {
  log('render', props)
  const {
    formName,
    onChange,
    className,
    value,
    dispatch,
    validate,
    id,
    label,
    fieldErrors = {},
    ...rest
  } = props

  const updateValue = (value, id, event) => {
    if (onChange) {
      onChange(value, id, event)
      return
    }
    try {
      dispatch(setFormValueTyped({formName, id, value}))
      if (validate) {
        validate(value)
      }
      dispatch(setFormFieldError({formName, id, error: null}))
    } catch (err) {
      dispatch(setFormFieldError({formName, id, error: err.message}))
    }
  }

  const onInputChange = event => {
    const {id, value} = event.target
    log('onInputChange', id, value)
    updateValue(value, id, event)
  }

  const error = fieldErrors[id]

  return (
    <div className={className}>
      <label
        className="leading-tight text-sm tracking-tight text-gray-700"
        htmlFor={id}
      >
        {label}
        <input
          {...rest}
          id={id}
          required
          className={cn(
            {
              'text-red-600': Boolean(error),
              'text-default': !error
            },
            'input block w-full text-base rounded-sm bg-gray-300 hover:bg-gray-400',
            'appearance-none py-1 px-1 leading-tight',
            'focus:outline-none focus:shadow-outline'
          )}
          value={value || ''}
          onChange={onInputChange}
        />
      </label>
      {error && (
        <div className="text-sm text-red-600 w-full">{error}</div>
      )}
    </div>
  )
}

const checkProps = (props, propName, componentName) => {
  if (!props.formName && !props.onChange) {
    return new Error(
      `One of props 'formName' or 'onChange' should be specified in '${componentName}'`
    )
  }
  if (props.formName && !props.id && !props.onChange) {
    return new Error(
      `When 'formName' is specified then 'id' or 'onChange' should be specified in '${componentName}'`
    )
  }
}

Input.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  formName: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ]),
  validate: PropTypes.func,
  label: PropTypes.string,
  fieldErrors: PropTypes.object,
  type: PropTypes.oneOf(['']),
  dispatch: PropTypes.func.isRequired,
  _: checkProps
}

const ConnectedInput = connect((state, props) => {
  const {formName, id} = props
  const form = getForm(state, {formName})
  const values = form ? getFormValues(form) : undefined
  let value
  if (props.value === undefined) {
    value = get(values, id)
  } else {
    value = props.value
  }
  const fieldErrors = form ? getFieldErrors(form) : undefined
  return {value, fieldErrors}
})(Input)

const FormInput = props => (
  <FormContext.Consumer>
    {context => <ConnectedInput formName={context} {...props} />}
  </FormContext.Consumer>
)

export default FormInput
