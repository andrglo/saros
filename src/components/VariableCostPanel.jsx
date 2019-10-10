import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import sortBy from 'lodash/sortBy'
import {connect} from 'react-redux'
import debug from 'debug'
import capitalize from 'lodash/capitalize'

import VariableCostList from './VariableCostList'
import {getVariableCostTransactions} from '../selectors/docs'
import {
  getCurrentDate,
  addMonths,
  extractYearMonth,
  toDateString,
  getCurrentMonth
} from '../lib/date'
import {createSelector} from '../lib/reselect'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('variableCost:panel')

const VariableCostPanel = props => {
  const {className, transactions, month} = props
  // log('render', props)
  const {income, expense} = transactions
  let period
  const currentMonth = getCurrentMonth()
  if (month === addMonths(currentMonth, -1)) {
    period = t`Last month`
  } else if (month === addMonths(currentMonth, 1)) {
    period = t`Next month`
  } else {
    period = capitalize(
      toDateString(month, {
        month: 'long',
        year: 'numeric'
      })
    )
  }
  return (
    <div className={cn('border-b pb-1', className)}>
      <p className="px-1 font-semibold tracking-wider italic">
        {period}
      </p>
      <p className="px-1 text-sm italic text-income">{t`Incomes`}</p>
      <VariableCostList transactions={income} />
      <p className="px-1 text-sm italic text-expense">{t`Expenses`}</p>
      <VariableCostList transactions={expense} />
    </div>
  )
}

VariableCostPanel.propTypes = {
  className: PropTypes.string,
  transactions: PropTypes.object.isRequired,
  month: PropTypes.string.isRequired
}

const selectTransactions = createSelector(
  getVariableCostTransactions,
  (_, {month}) => month,
  (transactions, month) => {
    transactions = sortBy(
      transactions.filter(t => t.month === month),
      'description'
    )
    return {
      income: transactions.filter(t => t.type === 'income'),
      expense: transactions.filter(t => t.type === 'expense')
    }
  }
)

export default connect((state, props) => {
  const {scope} = props
  const today = getCurrentDate()
  let month = extractYearMonth(today)
  switch (scope) {
    case 'overdue':
      month = addMonths(month, -1)
      break
    case 'forecast':
      month = addMonths(month, 1)
      break
  }
  const oneMonthAfterToday = addMonths(today, 1)
  const transactions = selectTransactions(state, {
    from: null,
    to: oneMonthAfterToday,
    month
  })
  return {
    transactions,
    month
  }
})(VariableCostPanel)
