import React, {useRef, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import Link from './Link'

const getItemId = i => `link_${i}`

const Menu = props => {
  const {className, options, onClose, focus} = props
  const overlayRef = useRef(null)
  useEffect(() => {
    const type = 'click'
    overlayRef.current.addEventListener(type, onClose)
    const onKeyDown = document.onkeydown
    document.onkeydown = event => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    return () => {
      overlayRef.current.removeEventListener(type, onClose)
      document.onkeydown = onKeyDown
    }
  }, [])
  const [focused, setFocus] = useState(focus ? 0 : -1)
  useEffect(() => {
    const item = document.getElementById(getItemId(focused))
    if (item) {
      item.focus()
    }
  }, [focused])
  let i = -1
  return (
    <React.Fragment>
      <div
        className="fixed h-screen w-screen inset-0"
        ref={overlayRef}
      />
      <div
        className={cn(
          'bg-menu text-menu rounded shadow-md z-30',
          className
        )}
        role="menu"
        onClick={onClose}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            if (focused < i) {
              setFocus(focused + 1)
            }
          } else if (event.key === 'ArrowUp') {
            if (focused > 0) {
              setFocus(focused - 1)
            }
          }
        }}
      >
        {options.map(option => {
          const {label, link, icon, divider} = option
          return (
            divider || (
              <Link
                key={label}
                id={getItemId(++i)}
                to={link}
                onFocus={() => {
                  if (focused < 0) {
                    setFocus(0)
                  }
                }}
                className="bg-menu text-menu hover:bg-menu-highlight p-2 w-full text-left block hover:no-underline flex justify-start items-center mb-1 rounded-sm"
              >
                {icon}
                <span className="pl-2">{label}</span>
              </Link>
            )
          )
        })}
      </div>
    </React.Fragment>
  )
}

Menu.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  focus: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      link: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.func.isRequired
      ]),
      icon: PropTypes.element,
      divider: PropTypes.element
    }).isRequired
  ).isRequired
}

export default Menu
