import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import {formatCurrency} from '../lib/format'

const AmountRow = props => {
  const {
    className,
    descriptionClass,
    amountClass,
    truncate = true,
    description,
    amount,
    isPinned
  } = props
  const isPositive = amount > 0
  const isNegative = amount < 0
  return (
    <div className={cn('flex px-1', className)}>
      <p
        className={cn(
          'flex-1',
          {
            truncate
          },
          descriptionClass
        )}
      >
        {isPinned && '📌'}
        {description}
      </p>
      <p
        className={cn(
          'my-auto',
          {
            'text-expense': isNegative,
            'text-income': isPositive
          },
          amountClass
        )}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  )
}

AmountRow.propTypes = {
  className: PropTypes.string,
  descriptionClass: PropTypes.string,
  amountClass: PropTypes.string,
  description: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  truncate: PropTypes.bool,
  isPinned: PropTypes.bool
}

export default AmountRow
