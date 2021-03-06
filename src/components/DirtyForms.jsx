import React, {useState, useCallback, useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import startCase from 'lodash/startCase'

import LinkMenu from './LinkMenu'

import {FormIcon} from '../assets/icons'
import {getDirtyForms, getForm} from '../selectors/forms'
import {getElapsedTimeDescription} from '../lib/date'

const log = debug('form:dirty')

const DirtyForm = props => {
  const {editStartTime, formName} = props
  log('DirtyForm', props)
  const title = props.title || startCase(formName)
  return (
    <div>
      <div className="px-2">{title}</div>
      {editStartTime && (
        <div className="pr-2 float-right text-xs italic">
          {getElapsedTimeDescription(editStartTime)}
        </div>
      )}
    </div>
  )
}

DirtyForm.propTypes = {
  title: PropTypes.string,
  formName: PropTypes.string,
  editStartTime: PropTypes.number
}

let DirtyFormsList = props => {
  const {buttonRef, onClose, dirtyForms} = props
  log('DirtyFormsList', props)

  return (
    <LinkMenu
      onClose={onClose}
      menuButtonRef={buttonRef}
      options={dirtyForms.map(form => {
        return {
          key: form.formName,
          label: <DirtyForm {...form} />,
          link: form.pathname
        }
      })}
    />
  )
}

DirtyFormsList.propTypes = {
  buttonRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  dirtyForms: PropTypes.arrayOf(PropTypes.object.isRequired)
}

DirtyFormsList = connect(state => {
  return {
    dirtyForms: getDirtyForms(state).map(formName => ({
      formName,
      ...getForm(state, {formName})
    }))
  }
})(DirtyFormsList)

const DirtyFormsButton = props => {
  log('DirtyFormsButton', props)
  const {dispatch, className, dirtyFormsCounter, ...rest} = props
  const buttonRef = useRef(null)
  const [showList, setShowList] = useState(false)
  const onClick = useCallback(() => {
    setShowList(!showList)
  }, [showList])
  log('render', buttonRef, showList)
  return (
    dirtyFormsCounter > 0 && (
      <React.Fragment>
        <button
          type="button"
          ref={buttonRef}
          className={cn(
            className,
            'w-10 h-10 rounded-full hover:bg-highlight cursor-pointer relative'
          )}
          onClick={onClick}
          {...rest}
        >
          <FormIcon className="w-6 h-10 m-auto" />
          <span className="absolute top-0 pl-2 pr-2 bg-contrast text-contrast text-center align-middle leading-loose rounded-full h-6 text-xs">
            {dirtyFormsCounter}
          </span>
        </button>
        {showList && (
          <DirtyFormsList buttonRef={buttonRef} onClose={onClick} />
        )}
      </React.Fragment>
    )
  )
}

DirtyFormsButton.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  dirtyFormsCounter: PropTypes.number.isRequired
}

export default connect(state => {
  return {
    dirtyFormsCounter: getDirtyForms(state).length
  }
})(DirtyFormsButton)
