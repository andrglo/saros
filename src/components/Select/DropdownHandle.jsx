/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React from 'react'

const DropdownHandle = ({
  dropdownHandleRenderer,
  isDropdownOpen,
  methods
}) => {
  const style = {
    textAlign: 'center',
    cursor: 'pointer',
    transform: `rotate(${isDropdownOpen ? 0 : 180}deg)`,
    transition: 'transform .3s ease'
  }
  return dropdownHandleRenderer ? (
    dropdownHandleRenderer({isDropdownOpen, methods})
  ) : (
    <button
      style={style}
      tabIndex="-1"
      type="button"
      className="focus:outline-none"
      onClick={event => {
        methods.dropDown(isDropdownOpen ? 'close' : 'open', event)
      }}
      // onKeyPress={event => methods.dropDown('toggle', event)}
      // onKeyDown={event => methods.dropDown('toggle', event)}
    >
      <svg width="16" fill="currentColor" viewBox="0 0 40 40">
        <path d="M31 26.4q0 .3-.2.5l-1.1 1.2q-.3.2-.6.2t-.5-.2l-8.7-8.8-8.8 8.8q-.2.2-.5.2t-.5-.2l-1.2-1.2q-.2-.2-.2-.5t.2-.5l10.4-10.4q.3-.2.6-.2t.5.2l10.4 10.4q.2.2.2.5z" />
      </svg>
    </button>
  )
}

export default DropdownHandle
