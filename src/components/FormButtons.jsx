import React, {useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'

import t from '../lib/translate'
import extractClassesByComponent from '../lib/extractClassesByComponent'

import {FormContext} from './Form'
import {
  getFormIsDirty,
  getForm,
  getFormLock,
  getFormInitialValues
} from '../selectors/forms'

const ButtonsPanel = props => {
  const {
    dispatch,
    onDelete,
    onReset,
    className,
    style,
    formName,
    isDirty,
    isNew,
    lock,
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
  const deleting = lock === 'deleting'
  const saving = lock === 'saving'
  return (
    <div
      className={cn('w-full flex pt-6', classes.container)}
      style={{
        gridColumn: '1 / -1',
        ...(style || {})
      }}
      {...rest}
    >
      <button
        style={deleting ? {cursor: 'wait'} : undefined}
        className={cn('btn btn-tertiary', classes.deleteButton)}
        type="button"
        tabIndex={navAll}
        disabled={Boolean(lock)}
        onClick={onDelete}
        {...focus}
      >
        {deleting ? t`Deleting` : t`Delete`}
      </button>
      <span className="flex-1" />
      <button
        className={cn('btn btn-secondary mr-1', classes.resetButton)}
        type="reset"
        tabIndex={navAll}
        disabled={!isDirty || Boolean(lock)}
        onClick={onReset}
        {...focus}
      >
        {isNew ? t`Reset` : t`Restore`}
      </button>
      <button
        className={cn('btn', classes.defaultButton)}
        style={saving ? {cursor: 'wait'} : undefined}
        type="submit"
        disabled={!isDirty || Boolean(lock)}
        {...focus}
      >
        {saving ? t`Saving` : t`Save`}
      </button>
    </div>
  )
}

ButtonsPanel.propTypes = {
  dispatch: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  formName: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  isDirty: PropTypes.bool,
  isNew: PropTypes.bool.isRequired,
  lock: PropTypes.string
}

const ConnectedButtonsPanel = connect((state, props) => {
  const {formName} = props
  const form = getForm(state, {formName})
  const initialValues = (form && getFormInitialValues(form)) || {}
  return {
    isNew: Object.keys(initialValues).length === 0,
    isDirty: form && getFormIsDirty(form),
    lock: form && getFormLock(form)
  }
})(ButtonsPanel)

const FormButtons = props => (
  <FormContext.Consumer>
    {context => (
      <ConnectedButtonsPanel
        formName={context.formName}
        onReset={context.onReset}
        onDelete={context.onDelete}
        {...props}
      />
    )}
  </FormContext.Consumer>
)

export default FormButtons
