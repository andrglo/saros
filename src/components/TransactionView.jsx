import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:view')

const TransactionView = props => {
  const {dispatch, transaction, className, ...rest} = props
  const {type, description, amount} = transaction
  // log('render', transaction.type)
  const isTranfer = type === 'transfer'
  const isOutflow = Math.isNegative(amount)
  return (
    <div {...rest} className={cn('text-sm flex', className)}>
      <p className="truncate flex-1">{description}</p>
      <p
        className={cn({
          'text-expense': isOutflow && !isTranfer,
          'text-income': !isOutflow && !isTranfer
        })}
      >
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}

TransactionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired
}

export default connect()(TransactionView)
