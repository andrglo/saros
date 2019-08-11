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
import debounce from 'lodash/debounce'
import cn from 'classnames'
import debug from 'debug'

import extractClassesByComponent from '../lib/extractClassesByComponent'
import useOnClickOutside from '../hooks/useOnClickOutside'
import useEventListener from '../hooks/useEventListener'

const log = debug('select')

const UPDATE_BOUNDS_DELAY = 200
const MAX_DROPDOWN_HEIGHT = 400
const DROPDOWN_MARGIN_Y = 4
const MIN_OPTION_HEIGHT = 48

const Dropdown = props => {
  log('Dropdown', props)
  const {
    classes,
    bounds,
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
  if (
    window.innerHeight <
    bounds.bottom + maxDropdownHeight + DROPDOWN_MARGIN_Y * 2
  ) {
    style.maxHeight =
      window.innerHeight - bounds.bottom - DROPDOWN_MARGIN_Y * 2
    if (style.maxHeight < MIN_OPTION_HEIGHT) {
      delete style.top
      style.bottom = bounds.top - DROPDOWN_MARGIN_Y
      // toBeContinued...
    }
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
  maxDropdownHeight: PropTypes.number
}

const Select = props => {
  // log('render', props)
  const {className, maxDropdownHeight, ...rest} = props

  const containerRef = useRef(null)
  const dropdownRootRef = useRef(null)

  const [bounds, setBounds] = useState()
  const updateBounds = useCallback(
    debounce(() => {
      setBounds(containerRef.current.getBoundingClientRect())
    }, UPDATE_BOUNDS_DELAY),
    []
  )
  useEffect(updateBounds, [])
  useEventListener('resize', updateBounds)

  const [searchText, setSearchText] = useState('')
  const [isDropdownOpen, setDropdownOpen] = useState(false)

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
