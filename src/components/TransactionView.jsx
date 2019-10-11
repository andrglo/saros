import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'
import {getAccounts, isCreditcardAccount} from '../selectors/docs'
import {getBankIcon} from '../assets/banks'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:view')

const TransactionView = props => {
  const {dispatch, transaction, className, accounts, ...rest} = props
  const {
    type,
    description,
    amount,
    account,
    currencySymbol
  } = transaction
  const [isOpen, open] = useState()
  const isTranfer = type === 'transfer'
  const isOutflow = Math.isNegative(amount)
  const accountDoc = accounts[account] || {}
  const BankIcon = getBankIcon(accountDoc)
  const isBudget = type === 'rbud' || type === 'pbud'
  const isCreditTransaction = isCreditcardAccount(account, accounts)
  return (
    <div className="px-1 ">
      <button
        {...rest}
        className={cn(
          'py-1 sm:py-0 text-sm hover:bg-highlight flex w-full text-left rounded-sm',
          className
        )}
        onClick={() => {
          open(!isOpen)
        }}
      >
        <p
          className={cn('flex-1', {
            truncate: !isOpen
          })}
        >
          {description}
        </p>
        <div className="my-auto">
          <BankIcon name={accountDoc.name} className="mx-1" />
        </div>
        <p
          className={cn('my-auto', {
            'text-expense': isOutflow && !isTranfer,
            'text-income': !isOutflow && !isTranfer,
            'font-hairline italic': isBudget,
            'opacity-50': isCreditTransaction
          })}
        >
          <span className="text-xs tracking-tighter pr-1">
            {currencySymbol}
          </span>
          {formatCurrency(amount)}
        </p>
      </button>
    </div>
  )
}

TransactionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired,
  accounts: PropTypes.object
}

export default connect(state => {
  return {
    accounts: getAccounts(state)
  }
})(TransactionView)
