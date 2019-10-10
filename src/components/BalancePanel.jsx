import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import sortBy from 'lodash/sortBy'
import {connect} from 'react-redux'
import debug from 'debug'

import BalanceList from './BalanceList'
import {getAccountsBalance} from '../selectors/docs'
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
  const {className, accountsBalance} = props
  // log('render', props)
  return (
    <div className={cn('', className)}>
      {accountsBalance.map(ab => {
        return (
          <React.Fragment key={ab.type}>
            <p className="px-1 font-semibold tracking-wider italic">
              {getTypeName(ab.type)}
            </p>
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
  accountsBalance: PropTypes.array.isRequired
}

const sortAccounts = createSelector(
  getAccountsBalance,
  accountsBalance =>
    sortBy(
      Object.keys(accountsBalance).map(type => ({
        type,
        order: getTypeOrder(type),
        accounts: sortBy(accountsBalance[type], 'account.name')
      })),
      'order'
    )
)

export default connect(state => {
  const accountsBalance = sortAccounts(state)
  return {
    accountsBalance
  }
})(BalancePanel)
