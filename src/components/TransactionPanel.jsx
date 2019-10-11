import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import sortBy from 'lodash/sortBy'
import sumBy from 'lodash/sumBy'
import capitalize from 'lodash/capitalize'
import get from 'lodash/get'

import AmountRow from './AmountRow'
import TransactionList from './TransactionList'
import {
  getTransactionsByTimePeriods,
  sumAccountsBalance,
  isDue,
  getAccounts,
  isCreditcardAccount
} from '../selectors/docs'
import {
  toDateString,
  getCurrentDate,
  addMonths,
  getDaysUntil
} from '../lib/date'
import t from '../lib/translate'
import {
  createSelector,
  createStructuredSelector
} from '../lib/reselect'

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
            {period.from === today ? (
              <AmountRow
                descriptionClass="pb-1 italic font-semibold tracking-wider"
                description={period.name}
                amount={get(calendar, `${today}.balance`, 0)}
              />
            ) : (
              <p className="pb-1 px-1 italic font-semibold tracking-wider">
                {period.name}
              </p>
            )}
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
                  {from !== to &&
                    (date > today ? (
                      <AmountRow
                        descriptionClass="px-1 text-sm italic"
                        description={`${toDateString(
                          date
                        )}${description}`}
                        amount={get(calendar, `${date}.balance`, 0)}
                        truncate={false}
                      />
                    ) : (
                      <p className="px-1 text-sm italic">
                        {`${toDateString(date)}${description}`}
                      </p>
                    ))}
                  <TransactionList
                    transactions={get(
                      calendar,
                      `${date}.transactions`,
                      []
                    )}
                  />
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

const getNonPaid = ({status}) => isDue(status)

const selectPeriods = createSelector(
  createStructuredSelector({
    periods: getTransactionsByTimePeriods,
    accountsBalanceTotals: sumAccountsBalance,
    accounts: getAccounts,
    today: (_, {today}) => today,
    scope: (_, {scope}) => scope
  }),
  params => {
    let {
      periods,
      today,
      scope,
      accounts = {},
      accountsBalanceTotals
    } = params
    let balance = get(
      accountsBalanceTotals,
      'pinned.total',
      accountsBalanceTotals.total || 0
    )
    periods = sortBy(periods, 'to')
    periods = periods.map(period => {
      const {calendar} = period
      if (!calendar) {
        return period
      }
      period = {...period}
      period.calendar = {}
      const dates = Object.keys(calendar).sort()
      for (const date of dates) {
        const transactions = calendar[date]
        period.calendar[date] = {
          transactions
        }
        if (date >= today) {
          period.calendar[date].balance = balance
          for (const transaction of transactions) {
            if (!isCreditcardAccount(transaction.account, accounts)) {
              balance += transaction.amount
            } else {
              console.log('cc', transaction)
            }
          }
        }
      }
      return period
    })
    periods = periods.filter(period => {
      switch (scope) {
        case 'overdue':
          return period.to < today
        case 'due':
          return period.from === today && period.to === today
        case 'forecast':
          return period.from > today
      }
      return true
    })
    if (scope === 'due') {
      periods = sortBy(periods, 'to').reverse()
    }
    if (scope === 'forecast') {
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
