import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {hot} from 'react-hot-loader/root'
import debug from 'debug'

import TransactionPanel from './components/TransactionPanel'
import VariableCostPanel from './components/VariableCostPanel'
import RecentActivityPanel from './components/RecentActivityPanel'

// eslint-disable-next-line no-unused-vars
const log = debug('dashboard')

const Dashboard = props => {
  const {className} = props
  // log('render', props)
  return (
    <div
      className={cn(
        'w-full h-full overflow-x-hidden p-3 sm:p-1',
        className
      )}
    >
      <div className="dashboard">
        <RecentActivityPanel className="dashboard-panel" />
        <TransactionPanel
          className="dashboard-panel"
          scope="overdue"
        />
        <TransactionPanel className="dashboard-panel" scope="due" />
        <TransactionPanel
          className="dashboard-panel"
          scope="forecast"
        />
        <VariableCostPanel
          className="dashboard-panel"
          scope="overdue"
        />
        <VariableCostPanel className="dashboard-panel" scope="due" />
        <VariableCostPanel
          className="dashboard-panel"
          scope="forecast"
        />
      </div>
    </div>
  )
}

Dashboard.propTypes = {
  className: PropTypes.string
}

export default hot(Dashboard)
