import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'

import {FormIcon} from '../assets/icons'
import {getDirtyForms} from '../selectors/forms'

const DirtyForms = props => {
  const {dispatch, className, dirtyForms = [], ...rest} = props
  return (
    <div
      className={cn(
        className,
        'w-10 h-10 rounded-full hover:bg-highlight relative'
      )}
      {...rest}
    >
      <FormIcon className="w-6 h-10 m-auto" />
      <p>{dirtyForms.length}</p>
    </div>
  )
}

DirtyForms.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  dirtyForms: PropTypes.arrayOf(PropTypes.string.isRequired)
}

export default connect(state => {
  return {
    dirtyForms: getDirtyForms(state)
  }
})(DirtyForms)
