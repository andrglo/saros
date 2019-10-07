import React from 'react'
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types'
import {hot} from 'react-hot-loader/root'
import debug from 'debug'

import TransactionPanel from './components/TransactionPanel'

// eslint-disable-next-line no-unused-vars
const log = debug('dashboard')

const Dashboard = () => {
  // log('render', props)
  return (
    <div className="w-full h-full overflow-x-hidden p-3 sm:p-1">
      <div className="dashboard">
        <TransactionPanel
          className="dashboard-panel"
          scope="overdue"
        />
        <TransactionPanel className="dashboard-panel" scope="due" />
        <TransactionPanel
          className="dashboard-panel"
          scope="forecast"
        />
      </div>
    </div>
  )
}

Dashboard.propTypes = {}

export default hot(Dashboard)
