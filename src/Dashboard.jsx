import React, {useState, useRef, useCallback} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import cn from 'classnames'
import debug from 'debug'

import t from './lib/translate'
import {getUser, getBrowserLocation} from './selectors/app'

const log = debug('dashboard')

const Dashboard = props => {
  log('render', props)
  return 'To do'
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
  children: PropTypes.node,
  user: PropTypes.object.isRequired,
  isHome: PropTypes.bool
}

export default connect(state => {
  const browserLocation = getBrowserLocation(state)
  return {
    user: getUser(state),
    isHome: Boolean(
      !browserLocation || browserLocation.pathname === '/'
    )
  }
})(Dashboard)
