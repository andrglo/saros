import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import get from 'lodash/get'
import {connect} from 'react-redux'
import debug from 'debug'

import {formatCurrency} from '../lib/format'
import {getCurrencies} from '../selectors/atlas'
import {getDefaultCurrency, getCostCenters} from '../selectors/docs'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('variableCost:view')

const DetailView = props => {
  const {
    className,
    amountClass,
    description,
    isOutflow,
    amount,
    forecast
  } = props
  return (
    <div className={cn('flex', className)}>
      <p className="w-2/6">{description}</p>
      <div className="flex w-4/6">
        <p
          className={cn(
            'mr-1 font-hairline italic my-auto w-1/2 text-right',
            {
              'text-expense': isOutflow,
              'text-income': !isOutflow
            },
            amountClass
          )}
        >
          {formatCurrency(forecast)}
        </p>
        <p
          className={cn(
            'my-auto w-1/2 text-right',
            {
              'text-expense': isOutflow,
              'text-income': !isOutflow
            },
            amountClass
          )}
        >
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  )
}

DetailView.propTypes = {
  className: PropTypes.string,
  amountClass: PropTypes.string,
  description: PropTypes.string.isRequired,
  isOutflow: PropTypes.bool.isRequired,
  amount: PropTypes.number.isRequired,
  forecast: PropTypes.number.isRequired
}

const VariableCostView = props => {
  const {
    dispatch,
    transaction,
    className,
    currencies = {},
    defaultCurrency,
    costCenters = {},
    ...rest
  } = props
  const {description, amount, forecast} = transaction
  log('transaction', description, transaction)
  const [isOpen, setIsOpen] = useState()
  const isOutflow = Math.isNegative(amount)
  const currencySymbol =
    currencies[defaultCurrency].symbol || defaultCurrency
  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }
  const isIncome = forecast > 0
  const amountOverflow = Math.abs(amount) > Math.abs(forecast)
  return (
    <div
      {...rest}
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
      <div className="flex">
        <p
          className={cn('flex-1', {
            truncate: !isOpen
          })}
        >
          {description}
        </p>
        <p
          className={cn('my-auto font-hairline italic', {
            'text-expense': isOutflow,
            'text-income': !isOutflow,
            'bg-warning': amountOverflow && !isIncome,
            'bg-info': amountOverflow && isIncome
          })}
        >
          <span className="text-xs tracking-tighter pr-1">
            {currencySymbol}
          </span>
          {formatCurrency(amountOverflow ? amount : forecast)}
        </p>
      </div>
      {isOpen && (
        <div>
          {transaction.partitions.map(partition => {
            const {costCenter, forecast, amount} = partition
            return (
              <React.Fragment key={costCenter}>
                <DetailView
                  description={get(
                    costCenters,
                    `${costCenter}.name`,
                    ''
                  )}
                  isOutflow={isOutflow}
                  forecast={forecast}
                  amount={amount}
                />
              </React.Fragment>
            )
          })}
          {transaction.partitions.length > 1 && (
            <DetailView
              amountClass="border-t"
              description={t`Total`}
              isOutflow={isOutflow}
              forecast={forecast}
              amount={amount}
            />
          )}
        </div>
      )}
    </div>
  )
}

VariableCostView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string,
  transaction: PropTypes.object.isRequired,
  accounts: PropTypes.object,
  costCenters: PropTypes.object,
  currencies: PropTypes.object,
  defaultCurrency: PropTypes.string
}

export default connect(state => {
  return {
    currencies: getCurrencies(state),
    defaultCurrency: getDefaultCurrency(state),
    costCenters: getCostCenters(state)
  }
})(VariableCostView)
