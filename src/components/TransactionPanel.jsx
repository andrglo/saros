import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import sortBy from 'lodash/sortBy'
import capitalize from 'lodash/capitalize'

import TransactionList from './TransactionList'
import {getTransactionsByTimePeriods} from '../selectors/docs'
import {
  toDateString,
  getCurrentDate,
  addMonths,
  getDaysUntil
} from '../lib/date'
import t from '../lib/translate'
import {createSelector} from '../lib/reselect'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:panel')

const TransactionPanel = props => {
  const {className, periods, scope, today} = props
  // log('render', props)
  return (
    <div className={cn(className)}>
      {periods.map(period => {
        const {from, to, calendar = {}} = period
        const dates = Object.keys(calendar).sort()
        if (scope === 'overdue') {
          dates.reverse()
        }
        return (
          <div key={period.to} className="border-b pb-1">
            <p className="p-1 italic font-semibold tracking-wider">
              {period.name}
            </p>
            {dates.map(date => {
              const days = getDaysUntil(today, date)
              let description = ''
              if (Math.abs(days) < 31) {
                description = ` - ${capitalize(
                  toDateString(date, {
                    weekday: 'long'
                  })
                )}, ${
                  days > 0
                    ? t`in ${days} day`
                    : t`${Math.abs(days)} day ago`
                }`
              } else {
                const months = Math.round(days / 30)
                description =
                  ' - ' +
                  (days > 0
                    ? t`in ${months} month`
                    : t`${Math.abs(months)} month ago`)
              }
              return (
                <React.Fragment key={date}>
                  {from !== to && (
                    <p className="px-1 text-sm italic">
                      {`${toDateString(date)}${description}`}
                    </p>
                  )}
                  <TransactionList transactions={calendar[date]} />
                </React.Fragment>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

TransactionPanel.propTypes = {
  className: PropTypes.string,
  scope: PropTypes.string,
  today: PropTypes.string,
  periods: PropTypes.array.isRequired
}

const getNonPaid = ({status}) => status === 'due'

const selectPeriods = createSelector(
  getTransactionsByTimePeriods,
  (_, {today}) => today,
  (_, {scope}) => scope,
  (periods, today, scope) => {
    periods = periods.filter(period => {
      switch (scope) {
        case 'overdue':
          return period.to < today
        case 'due':
          return period.from === today && period.to === today
        case 'draft':
          return period.from > today
      }
      return true
    })
    if (scope === 'due') {
      periods = sortBy(periods, 'to').reverse()
    }
    if (scope === 'draft') {
      periods = sortBy(periods, 'from')
    }
    return periods
  }
)

export default connect((state, props) => {
  const {scope} = props
  const today = getCurrentDate()
  const oneMonthFromToday = addMonths(today, 1)
  const periods = selectPeriods(state, {
    from: null,
    to: oneMonthFromToday,
    filter: getNonPaid,
    today,
    scope
  })
  return {
    periods,
    today
  }
})(TransactionPanel)
