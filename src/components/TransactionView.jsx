import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

const log = debug('transaction:view')

const TransactionView = props => {
  const {dispatch, transaction, className, ...rest} = props
  log('render', props)
  return (
    <div
      {...rest}
      className={cn(
        'bg-gray-900 border hover:bg-gray-700',
        className
      )}
    >
      {JSON.stringify(transaction)}
    </div>
  )
}

TransactionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired
}

export default connect()(TransactionView)
