import React from 'react'
import PropTypes from 'prop-types'

const Alert = props => {
  const {title, type, message, buttonCaption, onClick} = props
  return (
    <div
      className="absolute z-50 bottom-0 m-3 bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md"
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          {type === 'info' && (
            <svg
              className="fill-current h-6 w-6 text-teal-500 mr-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
            </svg>
          )}
        </div>
        <div>
          {title && <p className="font-bold">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>
        {onClick && (
          <button
            className="bg-teal-600 hover:bg-teal-700 ml-2 text-teal-100 font-bold py-2 px-4 rounded-full"
            type="button"
            onClick={onClick}
          >
            {buttonCaption}
          </button>
        )}
      </div>
    </div>
  )
}

Alert.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  type: PropTypes.string,
  onClick: PropTypes.func,
  buttonCaption: PropTypes.string
}

export default Alert
