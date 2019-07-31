import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {FormContext} from './Form'

const log = debug('form:input')

const Input = props => {
  const {formName, className, dispatch, ...rest} = props

  const updateValueInForm = (id, value) => {
    try {
      dispatch(setFormValueChanged(formName, id, value))
      check(value, {minLength, maxLength})
      let state
      let db
      let params
      if (validate || this.state.onValueHasBeenSet) {
        state = store.getState()
        db = getFormDb(formName)
        const form = getForm(state, formName)
        const values = getFormValues(form)
        params = {
          id,
          value,
          option,
          formName,
          values,
          form,
          dispatch
        }
      }
      if (validate) {
        validate(state, db, params)
      }
      dispatch(fieldValidationSuccess(formName, id))
      if (this.state.onValueHasBeenSet) {
        this.state.onValueHasBeenSet(state, db, params)
      }
    } catch (err) {
      dispatch(fieldValidationFailure(formName, id, err.message))
    }
  }

  const onChange = event => {
    const {id, value} = event.target
    log('onChange', id, value)
    updateValueInForm(id, value)
  }

  return (
    <input
      {...rest}
      className={cn('', className)}
      onChange={onChange}
    />
  )
}

Input.propTypes = {
  className: PropTypes.string,
  formName: PropTypes.string.isRequired
  // dispatch: PropTypes.func.isRequired
}

const ConnectedInput = connect(state => {
  return {}
})(Input)

const FormInput = props => (
  <FormContext.Consumer>
    {context => <ConnectedInput formName={context} {...props} />}
  </FormContext.Consumer>
)

FormInput.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf([''])
}

export default FormInput
