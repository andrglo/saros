import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'
import {connect} from 'react-redux'
import debug from 'debug'

import AmountRow from './AmountRow'
import BalanceList from './BalanceList'
import {
  getAccountsBalance,
  sumAccountsBalance
} from '../selectors/docs'
import t from '../lib/translate'
import {createSelector} from '../lib/reselect'

// eslint-disable-next-line no-unused-vars
const log = debug('balancePanel:panel')

const getTypeName = type => {
  switch (type) {
    case 'regular':
      return t`regular account`
    case 'creditcard':
      return t`Credit card`
    case 'savings':
      return t`Savings`
    case 'foreignCurrency':
      return t`Foreign currency`

    case 'prepaidcard':
      return t`Prepaid card`
    default:
      return type
  }
}

const getTypeOrder = type => {
  switch (type) {
    case 'regular':
      return 1
    case 'creditcard':
      return 2
    case 'savings':
      return 3
    case 'foreignCurrency':
      return 4
    case 'prepaidcard':
      return 5
    default:
      return type
  }
}

const BalancePanel = props => {
  const {className, accountsBalance, balance} = props
  // log('render', props)
  return (
    <div className={cn('', className)}>
      <AmountRow
        descriptionClass="pb-2 px-1 text-xl"
        description={t`Balance`}
        amount={balance}
      />
      {accountsBalance.map(ab => {
        return (
          <React.Fragment key={ab.type}>
            <AmountRow
              descriptionClass="px-1 font-semibold tracking-wider italic"
              description={getTypeName(ab.type)}
              amount={ab.balance}
            />
            <BalanceList
              type={ab.type}
              accountsBalance={ab.accounts}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}

BalancePanel.propTypes = {
  className: PropTypes.string,
  accountsBalance: PropTypes.array.isRequired,
  balance: PropTypes.number.isRequired
}

const sortAccounts = createSelector(
  getAccountsBalance,
  sumAccountsBalance,
  (accountsBalance, accountsBalanceTotals) =>
    sortBy(
      Object.keys(accountsBalance).map(type => ({
        type,
        balance: get(
          accountsBalanceTotals,
          `pinned.type.${type}`,
          get(accountsBalanceTotals, `type.${type}`, 0)
        ),
        order: getTypeOrder(type),
        accounts: sortBy(accountsBalance[type], 'account.name')
      })),
      'order'
    )
)

export default connect(state => {
  const accountsBalance = sortAccounts(state)
  const accountsBalanceTotals = sumAccountsBalance(state)
  const balance = get(
    accountsBalanceTotals,
    'pinned.total',
    accountsBalanceTotals.total || 0
  )
  return {
    accountsBalance,
    balance
  }
})(BalancePanel)
