import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import TransactionList from './TransactionList'
import {getTransactionsByDay} from '../selectors/docs'
import {toDateString, getCurrentDate} from '../lib/date'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('transaction:panel')

const TransactionPanel = props => {
  const {className, calendar} = props
  // log('render', props)
  return (
    <div className={cn(className)}>
      {Object.keys(calendar)
        .sort()
        .map(date => {
          return (
            <div key={date} className="border-b pb-1">
              <p className="p-1 italic font-semibold tracking-wider">
                {date === getCurrentDate()
                  ? t`Today`
                  : toDateString(date)}
              </p>
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
