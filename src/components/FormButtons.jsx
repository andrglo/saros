import React, {useMemo, useCallback, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'

import t from '../lib/translate'
import extractClassesByComponent from '../lib/extractClassesByComponent'
import {resetForm} from '../reducers/forms'

import {FormContext} from './Form'
import {getFormIsDirty, getForm} from '../selectors/forms'
import {saveForm} from '../actions/forms'

const ButtonsPanel = props => {
  const {
    dispatch,
    className,
    style,
    formName,
    isDirty,
    ...rest
  } = props
  const [navAll, setNavAll] = useState('-1')
  const classes = useMemo(
    () => (className && extractClassesByComponent(className)) || {},
    [className]
  )
  const focus = useMemo(
    () => ({
      onFocus: () => {
        setNavAll('0')
      },
      onBlur: () => {
        setNavAll('-1')
      }
    }),
    []
  )
  return (
    <div
      className={cn('w-full flex', classes.container)}
      style={{
        gridColumn: '1 / -1',
        ...(style || {})
      }}
      {...rest}
    >
      <button
        className={cn('btn btn-tertiary', classes.deleteButton)}
        type="button"
        tabIndex={navAll}
        onClick={useCallback(() => {
          dispatch(saveForm({formName, toBeDeleted: true}))
        }, [dispatch, formName])}
        {...focus}
      >
        {t`Delete`}
      </button>
      <span className="flex-1" />
      <button
        className={cn('btn btn-secondary mr-1', classes.resetButton)}
        type="reset"
        tabIndex={navAll}
        disabled={!isDirty}
        onClick={useCallback(
          event => {
            event.preventDefault()
            dispatch(resetForm({formName}))
          },
          [dispatch, formName]
        )}
        {...focus}
      >
        {t`Restore`}
      </button>
      <button
        className={cn('btn btn-default', classes.defaultButton)}
        type="submit"
        {...focus}
      >
        {t`Save`}
      </button>
    </div>
  )
}

ButtonsPanel.propTypes = {
  dispatch: PropTypes.func.isRequired,
  formName: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  isDirty: PropTypes.bool
}

const ConnectedButtonsPanel = connect((state, props) => {
  const {formName} = props
  const form = getForm(state, {formName})
  return {
    isDirty: form && getFormIsDirty(form)
  }
})(ButtonsPanel)

const FormButtons = props => (
  <FormContext.Consumer>
    {context => (
      <ConnectedButtonsPanel formName={context} {...props} />
    )}
  </FormContext.Consumer>
)

export default FormButtons
