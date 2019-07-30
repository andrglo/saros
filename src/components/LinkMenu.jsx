import React, {useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import Link from './Link'

const Menu = props => {
  const {className, options, onClose} = props
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
  return (
    <React.Fragment>
      <div
        className="fixed h-screen w-screen inset-0"
        ref={overlayRef}
      />
      <nav
        className={cn(
          'bg-menu text-menu rounded shadow-md z-30',
          className
        )}
      >
        {options.map(option => {
          const {label, link, icon, divider} = option
          return (
            divider || (
              <Link
                key={label}
                to={link}
                className="bg-menu text-menu hover:bg-menuHover p-2 w-full text-left block hover:no-underline flex justify-start items-center mb-1 rounded-sm"
              >
                {icon}
                <span className="pl-2">{label}</span>
              </Link>
            )
          )
        })}
      </nav>
    </React.Fragment>
  )
}

Menu.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
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
