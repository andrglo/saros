import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:view')

const TransactionView = props => {
  const {dispatch, transaction, className, ...rest} = props
  const {id, type, description, amount} = transaction
  const [opened, open] = useState({})
  const isTranfer = type === 'transfer'
  const isOutflow = Math.isNegative(amount)
  return (
    <div className="px-1 ">
      <button
        {...rest}
        className={cn(
          'py-1 sm:py-0 text-sm hover:bg-highlight flex w-full text-left rounded-sm',
          className
        )}
        onClick={() => {
          open({...opened, [id]: !opened[id]})
        }}
      >
        <p
          className={cn('flex-1', {
            truncate: !opened[id]
          })}
        >
          {description}
        </p>
        <p>{type}</p>
        <p
          className={cn({
            'text-expense': isOutflow && !isTranfer,
            'text-income': !isOutflow && !isTranfer
          })}
        >
          {formatCurrency(Math.abs(amount))}
        </p>
      </button>
    </div>
  )
}

TransactionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired
}

export default connect()(TransactionView)
