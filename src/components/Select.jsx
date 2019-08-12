// Inspired by https://github.com/sanusart/react-dropdown-select
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react'
import {createPortal} from 'react-dom'
import PropTypes from 'prop-types'
import cn from 'classnames'
import debug from 'debug'

import extractClassesByComponent from '../lib/extractClassesByComponent'
import getScrollParent from '../lib/getScrollParent'
import useOnClickOutside from '../hooks/useOnClickOutside'
import useEventListener from '../hooks/useEventListener'

const log = debug('select')

const MAX_DROPDOWN_HEIGHT = 400
const DROPDOWN_MARGIN_Y = 4
const MIN_OPTION_HEIGHT = 48

const Dropdown = props => {
  log('Dropdown', props)
  const {
    classes,
    bounds,
    options = [],
    maxDropdownHeight = MAX_DROPDOWN_HEIGHT
  } = props
  if (!bounds) {
    return null
  }
  const style = {
    position: 'fixed',
    width: bounds.width,
    top: bounds.bottom,
    left: bounds.left,
    marginTop: DROPDOWN_MARGIN_Y,
    marginBottom: DROPDOWN_MARGIN_Y,
    maxHeight: maxDropdownHeight,
    overflow: 'auto',
    zIndex: 9999
  }
  style.maxHeight =
    window.innerHeight -
    bounds.bottom -
    window.pageYOffset -
    DROPDOWN_MARGIN_Y * 2
  if (style.maxHeight < MIN_OPTION_HEIGHT) {
    const height =
      options.length * MIN_OPTION_HEIGHT + MIN_OPTION_HEIGHT
    style.top = bounds.top - height - DROPDOWN_MARGIN_Y * 2
    style.height = height
    style.maxHeight =
      bounds.top - window.pageYOffset - DROPDOWN_MARGIN_Y * 2
  }
  return (
    <div style={style} className={classes.dropdown}>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
      <div className={classes.option}>Option</div>
    </div>
  )
}

Dropdown.propTypes = {
  classes: PropTypes.object.isRequired,
  bounds: PropTypes.object,
  maxDropdownHeight: PropTypes.number,
  options: PropTypes.array
}

const Select = props => {
  const {className, maxDropdownHeight, ...rest} = props

  const containerRef = useRef(null)
  const dropdownRootRef = useRef(null)

  const [searchText, setSearchText] = useState('')
  const [isDropdownOpen, setDropdownOpen] = useState(false)

  const [bounds, setBounds] = useState()
  const updateBounds = useCallback(() => {
    if (isDropdownOpen) {
      setBounds(containerRef.current.getBoundingClientRect())
    }
  }, [isDropdownOpen])
  useEffect(updateBounds, [isDropdownOpen])
  useEventListener('resize', updateBounds)
  useEventListener(
    'scroll',
    updateBounds,
    getScrollParent(containerRef.current)
  )

  const openDropdown = () => {
    if (isDropdownOpen) {
      return
    }
    dropdownRootRef.current = document.createElement('div')
    document.body.appendChild(dropdownRootRef.current)
    setDropdownOpen(true)
  }

  const closeDropdown = useCallback(() => {
    if (!isDropdownOpen) {
      return
    }
    document.body.removeChild(dropdownRootRef.current)
    dropdownRootRef.current = null
    setDropdownOpen(false)
  }, [isDropdownOpen])

  const domNodes = useMemo(
    () => [containerRef.current, dropdownRootRef.current],
    [containerRef.current, dropdownRootRef.current]
  )
  useOnClickOutside(domNodes, closeDropdown)

  const classes = useMemo(
    () => extractClassesByComponent(className),
    [className]
  )

  // log('render', props, {isDropdownOpen, bounds, dropdownRootRef})
  return (
    <div {...rest} ref={containerRef} className={classes.container}>
      <button
        type="button"
        onClick={() => {
          if (isDropdownOpen) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
      >
        Open/close dropdown
      </button>
      {isDropdownOpen &&
        createPortal(
          <Dropdown
            classes={classes}
            bounds={bounds}
            maxDropdownHeight={maxDropdownHeight}
          />,
          dropdownRootRef.current
        )}
    </div>
  )
}

Select.propTypes = {
  // ref: todo Support ref
  className: PropTypes.string.isRequired,
  maxDropdownHeight: PropTypes.number
}

export default Select
