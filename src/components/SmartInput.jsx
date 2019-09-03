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
import t from '../lib/translate'

const log = debug('input')

const checkMaxLength = (value, maxLength) => {
  if (value.length > maxLength) {
    throw new Error(t`Maximum length is ${maxLength}`)
  }
}

const checkMinLength = (value, minLength) => {
  if (value.length < minLength) {
    throw new Error(t`Minimun length is ${minLength}`)
  }
}

const SimpleInput = props => {
  return (
    <input
      {...props}
      className={cn(
        extractClassesByComponent(props.className).container,
        'text-default bg-default'
      )}
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
    style,
    isLoading,
    maxLength,
    minLength,
    ...rest
  } = props

  const updateValue = (value, id, event) => {
    if (onChange) {
      onChange(value, id, event)
      return
    }
    try {
      dispatch(setFormValueTyped({formName, id, value}))
      if (maxLength !== undefined) {
        checkMaxLength(value, maxLength)
      }
      if (minLength !== undefined) {
        checkMinLength(value, minLength)
      }
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
    inputProps.caption = label
    inputProps.isLoading = isLoading
  } else {
    Component = SimpleInput
    inputProps.onChange = onInputChange
  }

  const isSelect = Component === Select

  return (
    <div className={cn(className, 'w-full')} style={style}>
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
              'content-single {}': isSelect,
              'content-multi {}': isSelect,
              'clear {  }': isSelect
            },
            'border hover:bg-highlight hover:border hover:border-highlight',
            'block w-full text-base rounded-sm',
            'appearance-none py-1 px-1 leading-tight',
            'dropdown { bg-input border rounded-sm }',
            'expand-button { pr-1 sm:pr-0 }',
            'option {}'
          )}
          value={value || ''}
          {...inputProps}
        />
      </label>
      {error && (
        <div className="text-sm text-error w-full">{error}</div>
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
  style: PropTypes.object,
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
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  label: PropTypes.string,
  fieldErrors: PropTypes.object,
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([
          PropTypes.string.isRequired,
          PropTypes.number.isRequired
        ])
      }).isRequired
    ),
    PropTypes.func
  ]),
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf(['']),
  dispatch: PropTypes.func.isRequired,
  _: checkProps
}

const noOptions = []

const ConnectedInput = connect((state, props) => {
  let {formName, id, options} = props
  const form = getForm(state, {formName})
  const values = form ? getFormValues(form) : undefined
  let value
  if (props.value === undefined) {
    value = get(values, id)
  } else {
    value = props.value
  }
  const fieldErrors = form ? getFieldErrors(form) : undefined
  let isLoading
  if (typeof options === 'function') {
    options = options(state, {...(values || {})})
    if (!options) {
      options = noOptions
      isLoading = true
    }
  }
  return {value, fieldErrors, options, isLoading}
})(Input)

const SmartInput = props => (
  <FormContext.Consumer>
    {context => (
      <ConnectedInput
        formName={context && context.formName}
        {...props}
      />
    )}
  </FormContext.Consumer>
)

export default SmartInput
