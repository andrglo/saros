import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

const ExpandableRow = props => {
  const {className, children, isOpen, setIsOpen} = props
  const toggleOpen = event => {
    event.stopPropagation()
    setIsOpen(!isOpen)
  }
  return (
    <div
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
      {children}
    </div>
  )
}

ExpandableRow.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func.isRequired
}
export default ExpandableRow
