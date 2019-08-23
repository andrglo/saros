/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
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
import normalize from '../lib/normalize'
import sanitize from '../lib/sanitize'
import useOnClickOutside from '../hooks/useOnClickOutside'
import {ChevronDown} from '../assets/icons'
import t from '../lib/translate'
import useBounds from '../hooks/useBounds'
import usePreviousValue from '../hooks/usePreviousValue'

// eslint-disable-next-line no-unused-vars
const log = debug('select')

const MAX_DROPDOWN_HEIGHT = 200
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
    selectedIndex,
    options = [],
    onChange,
    maxDropdownHeight = MAX_DROPDOWN_HEIGHT,
    hasOptionsNotShowed,
    focusedIndex,
    caption
  } = props
  const [height, setHeight] = useState(MAX_DROPDOWN_HEIGHT)
  const focusedRef = useRef(null)
  const dropdownRef = useRef(null)

  const previousFocusedIndex = usePreviousValue(focusedIndex)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (focusedRef.current) {
      // log('useEffect', focusedIndex, focusedRef.current.innerText)
      focusedRef.current.scrollIntoView({
        behavior:
          focusedIndex === previousFocusedIndex + 1 ||
          focusedIndex === previousFocusedIndex - 1
            ? 'smooth'
            : 'auto',
        block: 'nearest'
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
    zIndex: 9999
  }

  let topExpanded
  style.maxHeight =
    window.innerHeight -
    bounds.bottom -
    window.pageYOffset -
    DROPDOWN_MARGIN_Y * 2
  if (style.maxHeight < MIN_OPTION_HEIGHT) {
    topExpanded = true
    style.top = bounds.top - height - DROPDOWN_MARGIN_Y * 2
    style.maxHeight =
      bounds.top - window.pageYOffset - DROPDOWN_MARGIN_Y * 2
  }
  if (style.maxHeight > maxDropdownHeight) {
    style.maxHeight = maxDropdownHeight
  }
  const lastIndex = options.length - 1
  const selectedOption = options[selectedIndex] || {}
  return (
    <div
      style={style}
      ref={dropdownRef}
      tabIndex="-1"
      aria-expanded="true"
      role="list"
    >
      {topExpanded && caption && (
        <div
          className="text-sm absolute rounded tracking-tighter font-bold text-default"
          style={{top: '-1.4em'}}
        >
          {caption}
        </div>
      )}
      <div className={cn(classes.dropdown, 'overflow-auto')}>
        {options.map((option, index) => {
          const isSelected = option.value === selectedOption.value
          const isFocused = index === focusedIndex
          return (
            <div
              key={option.value}
              className={cn('bg-menu text-input outline-none', {
                'border-divider border-b': index !== lastIndex
              })}
              ref={isFocused ? focusedRef : undefined}
            >
              <div
                id={option.value}
                style={{
                  cursor: 'pointer'
                }}
                className={cn(
                  'p-1 hover:bg-focused-input overflow-x-hidden',
                  {
                    [`bg-menu-selected  ${
                      classes['option-selected']
                    }`]: isSelected && !isFocused,
                    [`bg-menu-focused ${
                      classes['option-focused']
                    }`]: isFocused
                  },
                  classes.option
                )}
                onClick={onChange}
                onKeyPress={onChange}
                role="option"
                tabIndex="-1"
                aria-selected={isSelected}
                aria-disabled={false}
              >
                {option.label}
              </div>
              {hasOptionsNotShowed && index === lastIndex && (
                <div className="text-xs italic p-1 overflow-hidden tracking-tighter text-center text-warning">
                  {t`There are options not showed, please, type more text`}
                </div>
              )}
            </div>
          )
        })}
        {options.length === 0 && (
          <div className="text-sm italic p-1 overflow-hidden tracking-tighter text-center text-warning">
            {t`No options available`}
          </div>
        )}
      </div>
    </div>
  )
}

Dropdown.propTypes = {
  classes: PropTypes.object.isRequired,
  bounds: PropTypes.object,
  maxDropdownHeight: PropTypes.number,
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  selectedIndex: PropTypes.number.isRequired,
  hasOptionsNotShowed: PropTypes.bool.isRequired,
  caption: PropTypes.string,
  focusedIndex: PropTypes.number.isRequired
}

const Select = props => {
  let {
    className,
    maxDropdownHeight,
    options,
    multi,
    showfirstOptionAsDefault,
    allowAnyValue,
    onChange,
    placeholder = '',
    value = '',
    maxOptionsToShow = -1,
    caption,
    ...rest
  } = props

  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const dropdownRootRef = useRef(null)

  const [focusedIndex, setFocusedIndex] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [isDropdownOpen, setDropdownOpen] = useState(false)

  const bounds = useBounds(containerRef)
  const [hasOptionsNotShowed, setOptionsNotShowed] = useState(false)

  options = useMemo(() => {
    let result = options
    if (searchText) {
      const slug = normalize(searchText)
      const betterMatches = []
      const matches = []
      setOptionsNotShowed(false)
      const maxLengthWasHit =
        maxOptionsToShow > -1
          ? length => {
              if (length === maxOptionsToShow) {
                setOptionsNotShowed(true)
                return true
              }
              return false
            }
          : () => false
      let length = 0
      for (const option of options) {
        const label = normalize(option.label)
        if (label.startsWith(slug)) {
          betterMatches.push(option)
          if (maxLengthWasHit(++length)) {
            break
          }
        } else if (label.includes(slug)) {
          matches.push(option)
          if (maxLengthWasHit(++length)) {
            break
          }
        }
      }
      result = [...betterMatches, ...matches]
    } else if (
      maxOptionsToShow > -1 &&
      options.length > maxOptionsToShow
    ) {
      setOptionsNotShowed(true)
      result = options.slice(0, maxOptionsToShow)
    }
    return result
  }, [maxOptionsToShow, options, searchText])

  let selectedIndex = -1
  if (!multi) {
    selectedIndex = options.findIndex(
      option => option.value === value
    )
    if (
      showfirstOptionAsDefault &&
      selectedIndex === -1 &&
      isValueEmpty(searchText)
    ) {
      selectedIndex = 0
    }
  }

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
    if (allowAnyValue !== true) {
      setSearchText('')
    }
  }, [allowAnyValue, isDropdownOpen])

  const handleEvent = useCallback(
    event => {
      // log(
      //   'handleEvent',
      //   event.type,
      //   event.target.id,
      //   event.key,
      //   focusedIndex
      // )
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
        setSearchText('')
        closeDropdown()
        onChange(value)
      } else {
        switch (event.key) {
          case Tab:
          case Enter: {
            if (!isDropdownOpen) {
              return
            }
            let nextValue
            if (multi) {
              // todo
            } else {
              nextValue = (options[focusedIndex] || {}).value
            }
            closeDropdown()
            if (nextValue !== undefined) {
              onChange(nextValue)
              setSearchText('')
            } else if (allowAnyValue === true) {
              onChange(searchText)
            } else {
              setSearchText('')
            }
            if (event.key === Enter) {
              event.preventDefault()
            }
            break
          }
          case Escape:
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
      allowAnyValue,
      closeDropdown,
      focusedIndex,
      isDropdownOpen,
      multi,
      onChange,
      openDropdown,
      options,
      searchText
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
  let display
  if (multi) {
    // todo
  } else if (!searchText) {
    const selectedOption = options[selectedIndex]
    if (selectedOption) {
      display = (
        <span className={classes.display}>
          {selectedOption.label}
        </span>
      )
    }
  }
  const previousValue = usePreviousValue(value)
  if (value !== previousValue) {
    if (selectedIndex === -1 && isValueEmpty(searchText)) {
      if (!Object.is(value, searchText)) {
        // Why this test is required?
        setSearchText(value)
      }
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
      <div
        className={cn(classes.value, 'flex flex-1 cursor-text', {
          'flex-wrap': multi
        })}
        onClick={() => inputRef.current.focus()}
      >
        {display}
        <input
          ref={inputRef}
          style={{
            backgroundColor: 'inherit',
            width: `${searchText.length + 1}ch`
          }}
          className={cn(classes.input, 'flex-1 focus:outline-none')}
          onFocus={openDropdown}
          value={searchText}
          onChange={event => {
            const searchText = sanitize(event.target.value)
            openDropdown()
            setSearchText(searchText)
            setFocusedIndex(0)
            if (allowAnyValue) {
              onChange(searchText)
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
            selectedIndex={selectedIndex}
            classes={classes}
            bounds={bounds}
            maxDropdownHeight={maxDropdownHeight}
            focusedIndex={focusedIndex}
            onChange={handleEvent}
            hasOptionsNotShowed={hasOptionsNotShowed}
            caption={caption}
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
  allowAnyValue: PropTypes.bool,
  maxOptionsToShow: PropTypes.number,
  caption: PropTypes.string,
  placeholder: PropTypes.string
}

export default Select
