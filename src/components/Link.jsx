import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import {pushBrowserLocation} from '../actions/app'

const Link = props => {
  const {dispatch, children, href, className} = props
  const navTo = () => {
    dispatch(pushBrowserLocation(href))
  }
  return (
    <span
      className={cn('hover:underline cursor-pointer', className)}
      onClick={navTo}
      onKeyDown={navTo}
      role="button"
      tabIndex="0"
    >
      {children}
    </span>
  )
}

Link.propTypes = {
  dispatch: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  href: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired
  ]).isRequired
}

export default connect()(Link)
