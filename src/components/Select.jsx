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
import normalize from '../lib/normalize'
import sanitize from '../lib/sanitize'
import useOnClickOutside from '../hooks/useOnClickOutside'
import useEventListener from '../hooks/useEventListener'
import {ChevronDown} from '../assets/icons'

// eslint-disable-next-line no-unused-vars
const log = debug('select')

const MAX_DROPDOWN_HEIGHT = 400
const DROPDOWN_MARGIN_Y = 4
const MIN_OPTION_HEIGHT = 48

const Tab = 'Tab'
const Escape = 'Escape'
const Enter = 'Enter'
const ArrowDown = 'ArrowDown'
const ArrowUp = 'ArrowUp'

const isValueEmpty = value => value === undefined || value === ''

const Dropdown = props => {
  // log('Dropdown', props)
  const {
    classes,
    bounds,
    selectedOption = {},
    options = [],
    onChange,
    maxDropdownHeight = MAX_DROPDOWN_HEIGHT,
    focusedIndex
  } = props
  const [height, setHeight] = useState(MAX_DROPDOWN_HEIGHT)
  const focusedRef = useRef(null)
  const dropdownRef = useRef(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (focusedRef.current) {
      focusedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      })
    }
    if (dropdownRef.current) {
      setHeight(dropdownRef.current.getBoundingClientRect().height)
    }
  })

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
    display: 'flex',
    flexDirection: 'column',
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
    style.top = bounds.top - height - DROPDOWN_MARGIN_Y * 2
    style.height = height
    style.maxHeight =
      bounds.top - window.pageYOffset - DROPDOWN_MARGIN_Y * 2
  }
  return (
    <div
      style={style}
      className={classes.dropdown}
      ref={dropdownRef}
      tabIndex="-1"
      aria-expanded="true"
      role="list"
    >
      {options.map((option, index) => {
        const isSelected = option.value === selectedOption.value
        const isFocused = index === focusedIndex
        return (
          <span
            key={option.value}
            id={option.value}
            ref={isFocused ? focusedRef : undefined}
            style={{
              cursor: 'pointer'
            }}
            role="option"
            tabIndex="-1"
            aria-selected={isSelected}
            aria-disabled={false}
            className={cn(
              'p-1 hover:bg-focused-input bg-menu text-input outline-none',
              {
                [`bg-menu-selected  ${classes['option-selected']}`]:
                  isSelected && !isFocused,
                [`bg-menu-focused ${
                  classes['option-focused']
                }`]: isFocused
              },
              classes.option
            )}
            onClick={onChange}
            onKeyPress={onChange}
          >
            {option.label}
          </span>
        )
      })}
    </div>
  )
}

Dropdown.propTypes = {
  classes: PropTypes.object.isRequired,
  bounds: PropTypes.object,
  maxDropdownHeight: PropTypes.number,
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  selectedOption: PropTypes.object,
  focusedIndex: PropTypes.number.isRequired
}

const Select = props => {
  const {
    className,
    maxDropdownHeight,
    options,
    multi,
    showfirstOptionAsDefault,
    onChange,
    placeholder = '',
    value = '',
    ...rest
  } = props

  let selectedIndex = -1
  if (!multi) {
    selectedIndex = options.findIndex(
      option => option.value === value
    )
  }

  const containerRef = useRef(null)
  const dropdownRootRef = useRef(null)

  const [focusedIndex, setFocusedIndex] = useState(0)
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

  const openDropdown = useCallback(() => {
    if (isDropdownOpen) {
      return
    }
    dropdownRootRef.current = document.createElement('div')
    document.body.appendChild(dropdownRootRef.current)
    setDropdownOpen(true)
    setFocusedIndex(selectedIndex === -1 ? 0 : selectedIndex)
  }, [isDropdownOpen, selectedIndex])

  const closeDropdown = useCallback(() => {
    if (!isDropdownOpen) {
      return
    }
    document.body.removeChild(dropdownRootRef.current)
    dropdownRootRef.current = null
    setDropdownOpen(false)
    setSearchText('')
  }, [isDropdownOpen])

  const handleEvent = useCallback(
    event => {
      log(
        'handleEvent',
        event.type,
        event.target.id,
        event.key,
        focusedIndex
      )
      if (event.type === 'click') {
        const option =
          options.find(
            option => String(option.value) === event.target.id
          ) || {}
        let value
        if (multi) {
          // todo
        } else {
          value = option.value || null
        }
        onChange(value)
      } else {
        switch (event.key) {
          case Enter: {
            let value
            if (multi) {
              // todo
            } else {
              value = options[focusedIndex].value
            }
            setSearchText('')
            closeDropdown()
            onChange(value)
            break
          }
          case Escape:
          case Tab:
            closeDropdown()
            break
          case ArrowDown: {
            let nextFocused = focusedIndex + 1
            const maxIndex = options.length - 1
            if (nextFocused > maxIndex) {
              nextFocused = maxIndex
            }
            openDropdown()
            setFocusedIndex(nextFocused)
            break
          }
          case ArrowUp: {
            let nextFocused = focusedIndex - 1
            if (nextFocused < 0) {
              nextFocused = 0
            }
            setFocusedIndex(nextFocused)
            break
          }
        }
      }
    },
    [
      closeDropdown,
      focusedIndex,
      multi,
      onChange,
      openDropdown,
      options
    ]
  )

  const selectRefs = useMemo(
    () => [containerRef, dropdownRootRef],
    []
  )
  useOnClickOutside(selectRefs, closeDropdown)

  const classes = useMemo(
    () => extractClassesByComponent(className),
    [className]
  )
  let selectedOption
  let display
  if (multi) {
    // todo
  } else if (!searchText) {
    selectedOption = options[selectedIndex]
    if (
      !selectedOption &&
      showfirstOptionAsDefault &&
      isValueEmpty(value)
    ) {
      selectedOption = options[0]
    }
    if (selectedOption) {
      display = (
        <span className={classes.display}>
          {selectedOption.label}
        </span>
      )
    }
  }

  // log('render', props, {
  //   isDropdownOpen,
  //   bounds,
  //   dropdownRootRef,
  //   focusedIndex
  // })
  return (
    <div
      {...rest}
      className={cn(
        classes.container,
        {
          'shadow-outline': isDropdownOpen
        },
        'flex'
      )}
      ref={containerRef}
      onKeyDown={handleEvent}
      role="combobox"
      aria-expanded="true"
      aria-controls=""
    >
      <div className={cn(classes.value, 'flex flex-1 flex-wrap')}>
        {display}
        <input
          style={{
            backgroundColor: 'inherit',
            width: `${searchText.length + 1}ch`
          }}
          className={cn(classes.input, 'focus:outline-none')}
          onFocus={openDropdown}
          value={searchText}
          onChange={event => {
            const searchText = sanitize(event.target.value)
            setSearchText(searchText)
            const slug = normalize(searchText)
            const focusedIndex = options.findIndex(option =>
              normalize(option.label).includes(slug)
            )
            openDropdown()
            // log('searchText', {searchText, slug, focusedIndex})
            if (focusedIndex > -1) {
              setFocusedIndex(focusedIndex)
            }
          }}
          placeholder={display ? '' : placeholder}
        />
      </div>
      <button
        className={cn('focus:outline-none', classes['expand-button'])}
        type="button"
        tabIndex="-1"
        style={{
          transform: `rotate(${isDropdownOpen ? 180 : 0}deg)`,
          transition: 'transform .3s ease'
        }}
        onClick={() => {
          if (isDropdownOpen) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
      >
        <ChevronDown />
      </button>
      {isDropdownOpen &&
        createPortal(
          <Dropdown
            options={options}
            selectedOption={selectedOption}
            classes={classes}
            bounds={bounds}
            maxDropdownHeight={maxDropdownHeight}
            focusedIndex={focusedIndex}
            onChange={handleEvent}
          />,
          dropdownRootRef.current
        )}
    </div>
  )
}

Select.propTypes = {
  // ref: todo Support ref
  className: PropTypes.string.isRequired,
  maxDropdownHeight: PropTypes.number,
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
        label: PropTypes.string.isRequired
      })
    )
  ]),
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
    PropTypes.arrayOf(PropTypes.string.isRequired),
    PropTypes.arrayOf(PropTypes.number.isRequired)
  ]),
  multi: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  showfirstOptionAsDefault: PropTypes.bool,
  placeholder: PropTypes.string
}

export default Select
