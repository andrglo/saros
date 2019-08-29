import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'

import {FormIcon} from '../assets/icons'
import {getDirtyForms} from '../selectors/forms'

const DirtyFormsButton = props => {
  const {dispatch, className, dirtyFormsCounter, ...rest} = props
  return (
    dirtyFormsCounter > 0 && (
      <button
        type="button"
        className={cn(
          className,
          'w-10 h-10 rounded-full hover:bg-highlight cursor-pointer relative focus:outline-none focus:shadow-outline'
        )}
        {...rest}
      >
        <FormIcon className="w-6 h-10 m-auto" />
        <span className="absolute top-0 pl-2 pr-2 bg-contrast text-contrast text-center align-middle leading-loose rounded-full h-6 text-xs">
          {dirtyFormsCounter}
        </span>
      </button>
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
