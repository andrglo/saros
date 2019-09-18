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
  const {className, calendar} = props
  // log('render', props)
  return (
    <div className={className}>
      {Object.keys(calendar)
        .sort()
        .map(date => {
          return (
            <div key={date}>
              {date}
              <br />
              <TransactionList transactions={calendar[date]} />
            </div>
          )
        })}
    </div>
  )
}

TransactionPanel.propTypes = {
  className: PropTypes.string,
  calendar: PropTypes.object.isRequired
}

export default connect((state, props) => {
  const {from, to} = props
  const calendar = getTransactionsByDay(state, {
    from,
    to
  })
  return {
    calendar
  }
})(TransactionPanel)
