import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import sortBy from 'lodash/sortBy'
import {connect} from 'react-redux'
import debug from 'debug'

import VariableCostList from './VariableCostList'
import {
  getBudgetsTransactions,
  isVariableCost
} from '../selectors/docs'
import {
  getCurrentDate,
  addMonths,
  extractYearMonth
} from '../lib/date'
import {createSelector} from '../lib/reselect'

// eslint-disable-next-line no-unused-vars
const log = debug('variableCost:panel')

const VariableCostPanel = props => {
  const {className, transactions} = props
  // log('render', props)
  const month = (transactions[0] && transactions[0].month) || ''
  return (
    <div className={cn('border-b pb-1', className)}>
      <p className="px-1 text-sm italic">{`${month}`}</p>
      <VariableCostList transactions={transactions} />
    </div>
  )
}

VariableCostPanel.propTypes = {
  className: PropTypes.string,
  transactions: PropTypes.array.isRequired
}

const getIsVariableCost = ({type}) => isVariableCost(type)

const selectTransactions = createSelector(
  getBudgetsTransactions,
  (_, {today}) => today,
  (_, {scope}) => scope,
  (transactions, today, scope) => {
    let month = extractYearMonth(today)
    switch (scope) {
      case 'overdue':
        month = addMonths(month, -1)
        break
      case 'forecast':
        month = addMonths(month, 1)
        break
    }
    return sortBy(
      transactions.filter(transaction => transaction.month === month),
      'description'
    )
  }
)

export default connect((state, props) => {
  const {scope} = props
  const today = getCurrentDate()
  const oneMonthAfterToday = addMonths(today, 1)
  const transactions = selectTransactions(state, {
    from: null,
    to: oneMonthAfterToday,
    filter: getIsVariableCost,
    today,
    scope
  })
  return {
    transactions,
    today
  }
})(VariableCostPanel)
