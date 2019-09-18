import React from 'react'
import PropTypes from 'prop-types'
import {hot} from 'react-hot-loader/root'
import {connect} from 'react-redux'
import debug from 'debug'

import TransactionPanel from './components/TransactionPanel'
import {
  startOfMonth,
  getCurrentDate,
  addDays,
  addMonths,
  endOfMonth
} from './lib/date'

const log = debug('dashboard')

const Dashboard = props => {
  log('render', props)
  const {
    today,
    yesterday,
    tomorrow,
    startOfPreviousMonth,
    endOfNextMonth
  } = props
  return (
    <div className="w-full h-full overflow-x-hidden p-4 sm:p-1">
      <div className="dashboard">
        <TransactionPanel
          className="dashboard-panel"
          from={today}
          to={today}
        />
        <TransactionPanel
          className="dashboard-panel"
          from={startOfPreviousMonth}
          to={yesterday}
        />
        <TransactionPanel
          className="dashboard-panel"
          from={tomorrow}
          to={endOfNextMonth}
        />
      </div>
    </div>
  )
}

Dashboard.propTypes = {
  today: PropTypes.string.isRequired,
  yesterday: PropTypes.string.isRequired,
  tomorrow: PropTypes.string.isRequired,
  startOfPreviousMonth: PropTypes.string.isRequired,
  endOfNextMonth: PropTypes.string.isRequired
}

export default connect(() => {
  const today = getCurrentDate()
  const startOfPreviousMonth = startOfMonth(addMonths(today, -1))
  const endOfNextMonth = endOfMonth(addMonths(today, 1))
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  return {
    today,
    yesterday,
    tomorrow,
    startOfPreviousMonth,
    endOfNextMonth
  }
})(hot(Dashboard))
