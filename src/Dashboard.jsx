import React from 'react'
// import PropTypes from 'prop-types'
import {connect} from 'react-redux'
// import cn from 'classnames'
import debug from 'debug'

import TransactionPanel from './components/TransactionPanel'
import {startOfMonth, today} from './lib/date'

const log = debug('dashboard')

const Dashboard = props => {
  log('render', props)
  return <TransactionPanel from={startOfMonth()} to={today()} />
}

Dashboard.propTypes = {}

export default connect()(Dashboard)
