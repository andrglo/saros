import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import Link from './Link'
import useOnClickOutside from '../hooks/useOnClickOutside'
import useKeyPress from '../hooks/useKeyPress'

const getItemId = i => `link_${i}`

const Menu = props => {
  const {className, options, onClose, focus} = props

  const [menuNode, setMenuNode] = useState()
  useOnClickOutside(menuNode, onClose)

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
      className={cn('bg-menu text-menu rounded shadow-md', className)}
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
