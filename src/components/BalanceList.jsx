import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import debug from 'debug'

import BalanceView from './BalanceView'

// eslint-disable-next-line no-unused-vars
const log = debug('balance:list')

const BalanceList = props => {
  const {accountsBalance, className, ...rest} = props
  // log('render', props)
  return (
    <ol {...rest} className={cn('pl-3', className)}>
      {accountsBalance.map(accountBalance => {
        return (
          <li key={accountBalance.id} className="">
            <BalanceView accountBalance={accountBalance} />
          </li>
        )
      })}
    </ol>
  )
}

BalanceList.propTypes = {
  className: PropTypes.string,
  accountsBalance: PropTypes.arrayOf(PropTypes.object.isRequired)
}

export default BalanceList
