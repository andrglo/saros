/* eslint-disable jsx-a11y/label-has-associated-control */
// Inspired by https://www.tailwindtoolbox.com/components/alerts
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import {
  WarningIcon,
  InfoIcon,
  ErrorIcon,
  CloseIcon
} from '../assets/icons'

const SLIDE_LEFT_TIMESPAN = 300 // --slide-left-timespan: 0.3s

const Alert = props => {
  const {
    title,
    message,
    buttonCaption,
    onClick,
    onClose,
    type
  } = props

  const [isOpen, setIsOpen] = useState(true)
  const onAction = event => {
    setIsOpen(false)
    const isFromButton = event.target.nodeName === 'BUTTON'
    event.persist()
    setTimeout(() => {
      if (isFromButton) {
        onClick(event)
        return
      }
      if (onClose) {
        onClose(event)
      }
    }, SLIDE_LEFT_TIMESPAN)
  }

  let color
  let Icon
  switch (type) {
    case 'warning':
      color = 'bg-warning text-warning'
      Icon = WarningIcon
      break
    case 'error':
      color = 'bg-error text-error'
      Icon = ErrorIcon
      break
    default:
      color = 'bg-info text-info'
      Icon = InfoIcon
  }
  const hasButton = Boolean(onClick)
  return (
    <div
      className={cn(
        color,
        'fixed bottom-0 left-0 m-4',
        'rounded-sm shadow border-divider border',
        'grid grid-columns-4 items-center p-2',
        {
          'slide-in-left': isOpen,
          'slide-out-left': !isOpen
        }
      )}
      style={{
        gridTemplateColumns: `1.5em auto ${
          hasButton ? '6' : '1'
        }em 1.5em`
      }}
    >
      <Icon className="h-6 w-6" />
      <div className="mx-2">
        {title && <p className="font-bold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        className={cn(
          'bg-primary hover:bg-divider text-primary font-semibold mx-3 py-1 px-1 border border-divider rounded shadow',
          {
            invisible: !hasButton
          }
        )}
        type="button"
        onClick={onAction}
      >
        {buttonCaption}
      </button>
      <CloseIcon
        className="close self-start w-6 h-6 -mt-2 ml-2"
        onClick={onAction}
      />
    </div>
  )
}

Alert.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['warning', 'error', 'info']),
  onClick: PropTypes.func,
  onClose: PropTypes.func,
  buttonCaption: PropTypes.string
}

export default Alert
