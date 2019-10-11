import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'
import {getAccounts, isCreditcardAccount} from '../selectors/docs'
import {getBankIcon} from '../assets/banks'
import {getIsPinned} from '../selectors/pin'
import {getCurrentDate} from '../lib/date'
import {setIsPinned} from '../reducers/pin'
import t from '../lib/translate'

import ExpandableRow from './ExpandableRow'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:view')

const DetailView = props => {
  const {className, isPinned, togglePin} = props
  return (
    <div className={cn('', className)}>
      {togglePin && (
        <button className="btn px-1 py-0 mt-1" onClick={togglePin}>
          {isPinned ? t`Unpin` : t`Pin`}
        </button>
      )}
    </div>
  )
}

DetailView.propTypes = {
  className: PropTypes.string,
  isPinned: PropTypes.bool,
  togglePin: PropTypes.func
}

const TransactionView = props => {
  const {
    dispatch,
    transaction,
    className,
    accounts,
    offBalance,
    isPinned,
    isCreditcardTransaction
  } = props
  const {
    type,
    description,
    amount,
    account,
    currencySymbol
  } = transaction
  const [isOpen, setIsOpen] = useState()
  const isTranfer = type === 'transfer'
  const isOutflow = Math.isNegative(amount)
  const accountDoc = accounts[account] || {}
  const BankIcon = getBankIcon(accountDoc)
  const isBudget = type === 'rbud' || type === 'pbud'
  let togglePin
  if (!isCreditcardTransaction) {
    togglePin = event => {
      event.stopPropagation()
      dispatch(
        setIsPinned({
          id: transaction.id,
          pin: !isPinned
        })
      )
    }
  }
  return (
    <ExpandableRow
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={cn(
        'py-1 sm:py-0 text-sm hover:bg-highlight w-full text-left rounded-sm',
        className
      )}
    >
      <div className="flex">
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
            'opacity-50': offBalance
          })}
        >
          <span className="text-xs tracking-tighter pr-1">
            {currencySymbol}
          </span>
          {formatCurrency(amount)}
        </p>
      </div>
      {isOpen && (
        <DetailView
          className="inline-block"
          isPinned={isPinned}
          togglePin={togglePin}
        />
      )}
    </ExpandableRow>
  )
}

TransactionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired,
  accounts: PropTypes.object,
  offBalance: PropTypes.bool,
  isPinned: PropTypes.bool,
  isCreditcardTransaction: PropTypes.bool
}

export default connect((state, props) => {
  const {transaction} = props
  const accounts = getAccounts(state)
  const {account} = transaction
  const isPinned = getIsPinned(state, {id: transaction.id})
  const isCreditcardTransaction = isCreditcardAccount(
    account,
    accounts
  )
  const isPast = transaction.dueDate < getCurrentDate()
  const offBalance =
    isCreditcardTransaction ||
    (isPast && !isPinned) ||
    (!isPast && isPinned)
  return {
    accounts,
    offBalance,
    isPinned,
    isCreditcardTransaction
  }
})(TransactionView)
