import React, {useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import NumberFormat from 'react-number-format'
import debug from 'debug'

// eslint-disable-next-line no-unused-vars
const log = debug('input:currency')

const CurrencyInput = props => {
  const {
    className,
    numeralPositiveOnly = true,
    paid,
    suspended,
    flow,
    autoFocus,
    displayZero,
    onChange,
    id,
    value = 0,
    ...relay
  } = props
  // log('render', props)
  const isPositive = value > 0
  const isNegative = value < 0
  let amount = value / 100
  if (numeralPositiveOnly) {
    amount = Math.abs(amount)
  }
  const amountRef = useRef(amount)
  const onValueChange = values => {
    amountRef.current = values.floatValue
  }

  const input = useRef(null)
  useEffect(() => {
    input.current = true
    return () => {
      input.current = null
    }
  }, [])
  const [hasFocus, setHasFocus] = useState(false)
  const onFocus = event => {
    if (!input.current) {
      return
    }
    setHasFocus(true)
    if (props.autoSelect) {
      event.target.select()
    }
    if (props.onFocus) {
      props.onFocus(event)
    }
  }
  const onBlur = event => {
    if (!input.current) {
      return
    }
    setHasFocus(false)
    if (props.onChange) {
      let newValue = Math.round(amountRef.current * 100)
      if (numeralPositiveOnly && isNegative) {
        newValue = -newValue
      }
      props.onChange(newValue, id)
    }
    if (props.onBlur) {
      props.onBlur(event)
    }
  }
  return (
    <NumberFormat
      {...relay}
      autoFocus={autoFocus}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      autoComplete="off"
      fixedDecimalScale={!hasFocus}
      allowNegative={!numeralPositiveOnly}
      type="tel"
      value={amount}
      onValueChange={onValueChange}
      className={cn(
        {
          'text-right': !hasFocus,
          'text-expense': isNegative,
          'text-income': isPositive
        },
        className
      )}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}

CurrencyInput.propTypes = {
  className: PropTypes.string,
  dirty: PropTypes.bool,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onChange: PropTypes.func,
  flow: PropTypes.string,
  numeralPositiveOnly: PropTypes.bool,
  paid: PropTypes.bool,
  suspended: PropTypes.bool,
  autoFocus: PropTypes.bool,
  autoSelect: PropTypes.bool,
  displayZero: PropTypes.bool
}

export default CurrencyInput
