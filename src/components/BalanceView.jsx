import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'
import {isCreditcard} from '../selectors/docs'
import {getIsPinned} from '../selectors/pin'
import {toDateString} from '../lib/date'
import {setIsPinned} from '../reducers/pin'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('balance:view')

const ExpandableView = props => {
  const {className, children, isOpen, setIsOpen} = props
  const toggleOpen = event => {
    event.stopPropagation()
    setIsOpen(!isOpen)
  }
  return (
    <div
      className={cn(
        'py-1 sm:py-0 text-sm hover:bg-highlight w-full text-left rounded-sm',
        {
          border: isOpen
        },
        className
      )}
      onClick={toggleOpen}
      onKeyPress={toggleOpen}
      role="button"
    >
      {children}
    </div>
  )
}

ExpandableView.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func.isRequired
}

const RowView = props => {
  const {
    className,
    truncate = true,
    description,
    amount,
    isPinned
  } = props
  const isPositive = amount > 0
  const isNegative = amount < 0
  return (
    <div className="flex">
      <p
        className={cn(
          'flex-1',
          {
            truncate
          },
          className
        )}
      >
        {isPinned && '📌'}
        {description}
      </p>
      <p
        className={cn('my-auto', {
          'text-expense': isNegative,
          'text-income': isPositive
        })}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  )
}

RowView.propTypes = {
  className: PropTypes.string,
  description: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  truncate: PropTypes.bool,
  isPinned: PropTypes.bool
}

const CreditcardView = props => {
  const {className, bills} = props
  const [isOpen, setIsOpen] = useState()
  return (
    <div className={cn('', className)}>
      {bills.map(bill => {
        const {dueDate, balance, transactions} = bill
        return (
          <ExpandableView
            key={dueDate}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            className={className}
          >
            <RowView
              description={toDateString(dueDate)}
              amount={balance}
              truncate={!isOpen}
            />
            {isOpen &&
              transactions.map(transaction => {
                return (
                  <RowView
                    key={transaction.id}
                    description={transaction.description}
                    amount={transaction.amount}
                  />
                )
              })}
          </ExpandableView>
        )
      })}
    </div>
  )
}

CreditcardView.propTypes = {
  className: PropTypes.string,
  bills: PropTypes.array.isRequired
}

const DetailView = props => {
  const {className, accountBalance, isPinned, togglePin} = props
  const {account, bills} = accountBalance
  // log('DetailView', accountBalance)
  return (
    <div className={cn('', className)}>
      {isCreditcard(account.type) ? (
        <CreditcardView bills={bills} />
      ) : (
        <React.Fragment>
          <RowView
            description={account.currency}
            amount={account.balance}
          />
          <button className="btn px-1 py-0 mt-1" onClick={togglePin}>
            {isPinned ? t`Unpin` : t`Pin`}
          </button>
        </React.Fragment>
      )}
    </div>
  )
}

DetailView.propTypes = {
  className: PropTypes.string,
  accountBalance: PropTypes.object.isRequired,
  isPinned: PropTypes.bool.isRequired,
  togglePin: PropTypes.func.isRequired
}

const BalanceView = props => {
  const {dispatch, className, accountBalance, isPinned} = props
  const {id, account, balance} = accountBalance
  const [isOpen, setIsOpen] = useState()
  // log('BalanceView', props)
  return (
    <ExpandableView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={className}
    >
      <RowView
        description={account.name}
        amount={balance}
        truncate={!isOpen}
        isPinned={isPinned}
      />
      {isOpen && (
        <DetailView
          isPinned={isPinned}
          togglePin={event => {
            event.stopPropagation()
            dispatch(setIsPinned({id, pin: !isPinned}))
          }}
          accountBalance={accountBalance}
        />
      )}
    </ExpandableView>
  )
}

BalanceView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  accountBalance: PropTypes.object.isRequired,
  isPinned: PropTypes.bool.isRequired
}

export default connect((state, props) => {
  const {accountBalance} = props
  const isPinned = getIsPinned(state, {id: accountBalance.id})
  return {
    isPinned
  }
})(BalanceView)
