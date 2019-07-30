import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import {pushBrowserLocation} from '../actions/app'

const Link = props => {
  const {dispatch, children, to, className} = props
  const navTo = () => {
    if (typeof to === 'function') {
      to()
    } else {
      dispatch(pushBrowserLocation(to))
    }
  }
  return (
    <button
      className={cn(
        'hover:underline cursor-pointer focus:outline-none focus:shadow-outline',
        className
      )}
      type="button"
      onClick={navTo}
    >
      {children}
    </button>
  )
}

Link.propTypes = {
  dispatch: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  to: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired,
    PropTypes.func.isRequired
  ]).isRequired
}

export default connect()(Link)
