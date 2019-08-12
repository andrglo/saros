import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import get from 'lodash/get'
import debug from 'debug'

import Select from './Select'

import {FormContext} from './Form'
import {
  getForm,
  getFormValues,
  getFieldErrors
} from '../selectors/forms'
import {setFormValueTyped, setFormFieldError} from '../reducers/forms'
import extractClassesByComponent from '../lib/extractClassesByComponent'

const log = debug('input')

const SimpleInput = props => {
  return (
    <input
      {...props}
      className={extractClassesByComponent(props.className).container}
    />
  )
}

SimpleInput.propTypes = {
  className: PropTypes.string
}

const Input = props => {
  // log('render', props)
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
    options,
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

  const onSelectChange = value => {
    log('onSelectChange', id, value)
    updateValue(value, id)
  }

  const onInputChange = event => {
    const {id, value} = event.target
    log('onInputChange', id, value)
    updateValue(value, id, event)
  }

  const error = fieldErrors[id]

  const inputProps = {}
  let Component
  if (options) {
    Component = Select
    inputProps.options = options
    inputProps.onChange = onSelectChange
  } else {
    Component = SimpleInput
    inputProps.onChange = onInputChange
  }

  const isSelect = Component === Select

  return (
    <div className={className}>
      <label
        className="leading-tight text-sm tracking-tight"
        htmlFor={id}
      >
        {label}
        <Component
          {...rest}
          id={id}
          required
          className={cn(
            {
              'text-error': Boolean(error),
              'text-input': !error,
              'input { placeholder-input }': isSelect,
              'content-single {}': isSelect,
              'content-multi {}': isSelect,
              'clear {  }': isSelect
            },
            'bg-input hover:bg-highlight-input border hover:border-highlight',
            'placeholder-input block w-full text-base rounded-sm',
            'appearance-none py-1 px-1 leading-tight',
            'focus:outline-none focus:shadow-outline',
            'dropdown { bg-input border rounded-sm }',
            'expand-button { pr-1 sm:pr-0 }',
            'option { p-1 hover:bg-highlight-input bg-menu text-input }'
          )}
          value={value || ''}
          {...inputProps}
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
  return null
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
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired
      ])
    }).isRequired
  ),
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
