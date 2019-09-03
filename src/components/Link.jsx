import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import {pushBrowserLocation} from '../actions/app'

const Link = props => {
  const {dispatch, to, className, ...rest} = props
  const navTo = () => {
    if (typeof to === 'function') {
      to()
    } else {
      dispatch(pushBrowserLocation(to))
    }
  }
  return (
    <button
      {...rest}
      className={cn(
        'hover:underline cursor-pointer rounded',
        className
      )}
      type="button"
      onClick={navTo}
    />
  )
}

Link.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  to: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired,
    PropTypes.func.isRequired
  ]).isRequired
}

export default connect()(Link)
