/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react'
import PropTypes from 'prop-types'
import {GoAlert, GoInfo, GoStop} from 'react-icons/go'

const Alert = props => {
  const {
    title,
    onClose,
    message,
    buttonCaption,
    onClick,
    position,
    type
  } = props
  let panel = ''
  let view = ''
  switch (position) {
    case 'banner':
      panel = 'alert-banner w-full fixed top-0'
      break
    case 'footer':
      panel = 'alert-footer w-full fixed bottom-0'
      break
    default:
      panel =
        'alert-toast fixed bottom-0 right-0 m-8 w-5/6 md:w-full max-w-sm'
      view = 'border-t-4 rounded-b shadow'
  }
  let icon
  let btn =
    'flex-initial ml-4 my-auto font-bold py-2 px-4 rounded-lg shadow-lg'
  switch (type) {
    case 'warning':
      view = `${view} bg-yellow-400 text-yellow-900 border-yellow-500`
      btn = `${btn} bg-yellow-500 hover:bg-yellow-600 text-yellow-900 `
      icon = (
        <GoAlert className="flex-initial h-6 w-6 text-yellow-800 mr-2 my-auto" />
      )
      break
    case 'error':
      view = `${view} bg-red-400 text-red-900 border-red-500`
      btn = `${btn} bg-red-500 hover:bg-red-600 text-red-900`
      icon = (
        <GoStop className="flex-initial h-6 w-6 text-red-800 mr-2 my-auto" />
      )
      break
    default:
      view = `${view} bg-teal-100 text-teal-900 border-teal-500`
      btn = `${btn} bg-teal-200 hover:bg-teal-300 text-teal-900`
      icon = (
        <GoInfo className="flex-initial h-6 w-6 text-teal-800 mr-2 my-auto" />
      )
  }
  return (
    <div className={panel}>
      <input
        type="checkbox"
        className="hidden"
        id="alert"
        onClick={() => setTimeout(() => onClose(), 1000)}
      />
      <div className={view}>
        <div className="flex items-start justify-start w-full p-2">
          {icon}
          <div className="flex-initial">
            {title && <p className="font-bold">{title}</p>}
            <p className="text-sm">{message}</p>
          </div>
          {onClick && (
            <button className={btn} type="button" onClick={onClick}>
              {buttonCaption}
            </button>
          )}
          <label
            className="close cursor-pointer flex-1"
            title="close"
            htmlFor="alert"
          >
            <svg
              className="fill-current float-right"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z" />
            </svg>
          </label>
        </div>
      </div>
    </div>
  )
}

Alert.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['warning', 'error', 'info']),
  position: PropTypes.oneOf(['banner', 'footer', 'toast']),
  onClick: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  buttonCaption: PropTypes.string
}

export default Alert
