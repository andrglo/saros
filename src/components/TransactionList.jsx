import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import TransactionView from './TransactionView'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:list')

const TransactionList = props => {
  const {dispatch, transactions, className, ...rest} = props
  // log('render', props)
  return (
    <ol {...rest} className={cn('pl-3', className)}>
      {transactions.map(transaction => {
        return (
          <li key={transaction.id} className="">
            <TransactionView transaction={transaction} />
          </li>
        )
      })}
    </ol>
  )
}

TransactionList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transactions: PropTypes.arrayOf(PropTypes.object.isRequired)
}

export default connect()(TransactionList)
