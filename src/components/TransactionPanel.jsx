import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import TransactionList from './TransactionList'
import {getTransactionsByDay} from '../selectors/docs'
import {
  toDateString,
  getCurrentDate,
  addDays,
  addMonths
} from '../lib/date'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:panel')

const TransactionPanel = props => {
  const {className, calendar} = props
  // log('render', props)
  return (
    <div className={cn(className)}>
      {Object.keys(calendar)
        .sort()
        .map(date => {
          return (
            <div key={date} className="border-b pb-1">
              <p className="p-1 italic font-semibold tracking-wider">
                {date === getCurrentDate()
                  ? t`Today`
                  : toDateString(date)}
              </p>
              <TransactionList transactions={calendar[date]} />
            </div>
          )
        })}
    </div>
  )
}

TransactionPanel.propTypes = {
  className: PropTypes.string,
  calendar: PropTypes.object.isRequired
}

const getNonPaid = ({status}) => status === 'due'

export default connect((state, props) => {
  const {scope} = props
  let calendar
  switch (scope) {
    case 'overdue':
      {
        const today = getCurrentDate()
        const yesterday = addDays(today, -1)
        calendar = getTransactionsByDay(state, {
          from: null,
          to: yesterday,
          filter: getNonPaid
        })
      }
      break
    case 'due':
      {
        const today = getCurrentDate()
        calendar = getTransactionsByDay(state, {
          from: today,
          to: today,
          filter: getNonPaid
        })
      }
      break
    case 'draft':
      {
        const today = getCurrentDate()
        const tomorrow = addDays(today, 1)
        const oneMonthFromToday = addMonths(today, 1)
        calendar = getTransactionsByDay(state, {
          from: tomorrow,
          to: oneMonthFromToday,
          filter: getNonPaid
        })
      }
      break
    default:
      {
        const {from, to} = props
        calendar = getTransactionsByDay(state, {
          from,
          to
        })
      }
      break
  }
  return {
    calendar
  }
})(TransactionPanel)
