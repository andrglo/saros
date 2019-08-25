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
  const {className, options, onClose, focus, menuButtonRef} = props
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
  if (buttonBounds && menuBounds) {
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

  const [focused, setFocus] = useState(focus ? 0 : -1)
  useEffect(() => {
    const item = document.getElementById(getItemId(focused))
    if (item) {
      item.focus()
    }
  }, [focused])
  let i = -1
  return (
    <div
      ref={setMenuNode}
      style={style}
      className={cn(
        'fixed bg-menu rounded shadow-md z-30 text-default',
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
              className="hover:bg-highlight p-2 w-full text-left block hover:no-underline flex justify-start items-center rounded-sm"
            >
              {icon}
              <span className="pl-2">{label}</span>
            </Link>
          )
        )
      })}
    </div>
  )
}

Menu.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  focus: PropTypes.bool,
  menuButtonRef: PropTypes.object,
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
