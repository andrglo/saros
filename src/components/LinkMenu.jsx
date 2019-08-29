import React, {useEffect, useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import debug from 'debug'

import Link from './Link'
import useOnClickOutside from '../hooks/useOnClickOutside'
import useKeyPress from '../hooks/useKeyPress'
import useBounds from '../hooks/useBounds'

// eslint-disable-next-line no-unused-vars
const log = debug('menu:link')

const getItemId = i => `link_${i}`
const GAP = 4

const Menu = props => {
  const {className, options, onClose, menuButtonRef} = props
  // log('render', props)

  const [menuNode, setMenuNode] = useState()
  useOnClickOutside(
    useMemo(() => [menuNode, menuButtonRef], [
      menuButtonRef,
      menuNode
    ]),
    onClose
  )

  const style = {top: -9999}
  const menuBounds = useBounds(menuNode)
  const buttonBounds = useBounds(menuButtonRef)
  if (buttonBounds && menuBounds && menuBounds.width) {
    style.top = buttonBounds.bottom + GAP
    if (
      buttonBounds.left + menuBounds.width + GAP <
      window.innerWidth
    ) {
      style.left = buttonBounds.left
    } else {
      style.right = window.innerWidth - buttonBounds.right
    }
  }

  useKeyPress('Escape', onClose)

  const [focused, setFocus] = useState(0)
  useEffect(() => {
    const item = document.getElementById(getItemId(focused))
    if (item) {
      item.focus()
    }
  }, [focused])
  let lastIndex = -1
  return (
    <ul
      ref={setMenuNode}
      style={style}
      className={cn(
        'fixed bg-menu rounded shadow-md z-30 text-default max-w-2xl overflow-x-hidden',
        className
      )}
      role="menu"
      onClick={onClose}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') {
          if (focused < lastIndex) {
            setFocus(focused + 1)
          }
        } else if (event.key === 'ArrowUp') {
          if (focused > 0) {
            setFocus(focused - 1)
          }
        } else if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (focused === 0) {
              onClose()
            } else {
              setFocus(focused - 1)
            }
          } else if (focused === lastIndex) {
            onClose()
          } else {
            setFocus(focused + 1)
          }
        }
      }}
    >
      {options.map((option, index) => {
        const {label, link, icon, divider} = option
        const labelIsString = typeof label === 'string'
        return (
          divider || (
            <li
              className="p-1"
              key={option.key || (labelIsString ? label : index)}
            >
              <Link
                id={getItemId(++lastIndex)}
                to={link}
                onFocus={() => {
                  if (focused < 0) {
                    setFocus(0)
                  }
                }}
                className="hover:bg-highlight p-2 w-full text-left block hover:no-underline flex justify-start items-center rounded-sm"
              >
                {icon}
                {labelIsString ? (
                  <span className="pl-2">{label}</span>
                ) : (
                  label
                )}
              </Link>
            </li>
          )
        )
      })}
    </ul>
  )
}

Menu.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  menuButtonRef: PropTypes.object,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.element.isRequired
      ]),
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
