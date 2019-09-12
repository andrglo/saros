import React from 'react'
import PropTypes from 'prop-types'
// import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import TransactionList from './TransactionList'
import {getTransactionsByDay} from '../selectors/docs'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:panel')

const TransactionPanel = props => {
  const {transactions} = props
  // log('render', props)
  // todo Create a list for each day
  return <TransactionList transactions={transactions} />
}

TransactionPanel.propTypes = {
  transactions: PropTypes.array
}

export default connect((state, props) => {
  const {from, to} = props
  const transactions = getTransactionsByDay(state, {
    from,
    to
  })
  return {
    transactions
  }
})(TransactionPanel)
