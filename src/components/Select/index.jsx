/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/default-props-match-prop-types */
import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cn from 'classnames'
import debug from 'debug'

import extractClassesByComponent from '../../lib/extractClassesByComponent'

import ClickOutside from './ClickOutside'

import Input from './Input'
import Dropdown from './Dropdown'
import Loading from './Loading'
import Clear from './Clear'
import Separator from './Separator'
import DropdownHandle from './DropdownHandle'
import Option from './Option'

import {
  debounce,
  isEqual,
  getByPath,
  getProp,
  valueExistInSelected
} from './util'

const log = debug('select')

class Select extends Component {
  constructor(props) {
    super(props)

    this.onDropdownClose = this.onDropdownClose.bind(this)
    this.onScroll = this.onScroll.bind(this)
    this.updateSelectBounds = this.updateSelectBounds.bind(this)
    this.getSelectBounds = this.getSelectBounds.bind(this)
    this.dropDown = this.dropDown.bind(this)
    this.getSelectRef = this.getSelectRef.bind(this)
    this.addItem = this.addItem.bind(this)
    this.removeItem = this.removeItem.bind(this)
    this.setSearch = this.setSearch.bind(this)
    this.getInputSize = this.getInputSize.bind(this)
    this.toggleSelectAll = this.toggleSelectAll.bind(this)
    this.clearAll = this.clearAll.bind(this)
    this.selectAll = this.selectAll.bind(this)
    this.isSelected = this.isSelected.bind(this)
    this.areAllSelected = this.areAllSelected.bind(this)
    this.safeString = this.safeString.bind(this)
    this.sortBy = this.sortBy.bind(this)
    this.searchFn = this.searchFn.bind(this)
    this.searchResults = this.searchResults.bind(this)
    this.activeCursorItem = this.activeCursorItem.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.renderDropdown = this.renderDropdown.bind(this)
    this.createNew = this.createNew.bind(this)

    this.state = {
      dropdown: false,
      search: '',
      selectBounds: {},
      cursor: null
    }

    this.methods = {
      removeItem: this.removeItem,
      dropDown: this.dropDown,
      addItem: this.addItem,
      setSearch: this.setSearch,
      getInputSize: this.getInputSize,
      toggleSelectAll: this.toggleSelectAll,
      clearAll: this.clearAll,
      selectAll: this.selectAll,
      searchResults: this.searchResults,
      getSelectRef: this.getSelectRef,
      isSelected: this.isSelected,
      getSelectBounds: this.getSelectBounds,
      areAllSelected: this.areAllSelected,
      handleKeyDown: this.handleKeyDown,
      activeCursorItem: this.activeCursorItem,
      createNew: this.createNew,
      sortBy: this.sortBy,
      safeString: this.safeString
    }

    this.select = React.createRef()
    this.dropdownRoot =
      typeof document !== 'undefined' && document.createElement('div')
  }

  componentDidMount() {
    if (this.props.portal) {
      this.props.portal.appendChild(this.dropdownRoot)
    }
    window.addEventListener(
      'resize',
      debounce(this.updateSelectBounds)
    )
    window.addEventListener('scroll', debounce(this.onScroll))

    this.dropDown('close')

    if (this.select) {
      this.updateSelectBounds()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevProps.values, this.props.values)) {
      this.updateSelectBounds()
    }

    if (prevState.search !== this.state.search) {
      this.updateSelectBounds()
    }

    // if (
    //   prevState.values !== this.state.values &&
    //   this.props.closeOnSelect
    // ) {
    //   log('closeOnSelect')
    //   this.dropDown('close')
    // }

    if (prevProps.multi !== this.props.multi) {
      this.updateSelectBounds()
    }

    if (
      prevState.dropdown &&
      prevState.dropdown !== this.state.dropdown
    ) {
      this.onDropdownClose()
    }

    if (
      !prevState.dropdown &&
      prevState.dropdown !== this.state.dropdown
    ) {
      this.props.onDropdownOpen()
    }
  }

  componentWillUnmount() {
    if (this.props.portal) {
      this.props.portal.removeChild(this.dropdownRoot)
    }
    window.removeEventListener(
      'resize',
      debounce(this.updateSelectBounds, this.props.debounceDelay)
    )
    window.removeEventListener(
      'scroll',
      debounce(this.onScroll, this.props.debounceDelay)
    )
  }

  onDropdownClose() {
    this.setState({cursor: null})
    this.props.onDropdownClose()
  }

  onScroll() {
    if (this.props.closeOnScroll) {
      this.dropDown('close')
    }
    this.updateSelectBounds()
  }

  getSelectBounds() {
    return this.state.selectBounds
  }

  getSelectRef() {
    return this.select.current
  }

  addItem(item) {
    log('addItem', item)
    if (this.props.multi) {
      if (
        valueExistInSelected(
          getByPath(item, this.props.valueField),
          this.props
        )
      ) {
        return this.removeItem(null, item, false)
      }

      this.setState({
        values: [...this.state.values, item]
      })
    } else {
      this.props.onChange(item.value, [item])
      this.dropDown('close')
      this.doNotOpenOnFocus = true
    }

    this.props.clearOnSelect && this.setState({search: ''})

    return true
  }

  removeItem(event, item, close = false) {
    if (event && close) {
      event.preventDefault()
      event.stopPropagation()
      this.dropDown('close')
    }

    this.setState({
      values: this.state.values.filter(
        values =>
          getByPath(values, this.props.valueField) !==
          getByPath(item, this.props.valueField)
      )
    })
  }

  setSearch(event) {
    this.setState({
      cursor: null
    })

    this.setState({
      search: event.target.value
    })
  }

  getInputSize() {
    if (this.state.search) {
      return this.state.search.length
    }

    if (this.props.value.length > 0) {
      return this.props.value.length
    }

    return this.props.placeholder.length
  }

  dropDown(action = 'toggle', event) {
    log('dropDown', action)
    const target =
      (event && event.target) || (event && event.srcElement)

    if (
      this.props.portal &&
      !this.props.closeOnScroll &&
      !this.props.closeOnSelect &&
      event &&
      target &&
      target.offsetParent &&
      target.offsetParent.classList.contains(
        'react-dropdown-select-dropdown'
      )
    ) {
      return
    }

    if (this.props.keepOpen) {
      return this.setState({dropdown: true})
    }

    if (action === 'close' && this.state.dropdown) {
      this.select.current.blur()

      return this.setState({
        dropdown: false,
        search: this.props.clearOnBlur ? '' : this.state.search
      })
    }

    if (action === 'open' && !this.state.dropdown) {
      return this.setState({dropdown: true})
    }

    if (action === 'toggle') {
      this.select.current.focus()
      return this.setState({dropdown: !this.state.dropdown})
    }

    return false
  }

  updateSelectBounds() {
    if (this.select.current) {
      this.setState({
        selectBounds: this.select.current.getBoundingClientRect()
      })
    }
  }

  toggleSelectAll() {
    return this.setState({
      values:
        this.state.values.length === 0
          ? this.selectAll()
          : this.clearAll()
    })
  }

  clearAll() {
    this.props.onClearAll()
    this.setState({
      values: []
    })
  }

  selectAll() {
    this.props.onSelectAll()
    return this.setState({
      values: this.props.options.filter(option => !option.disabled)
    })
  }

  isSelected(option) {
    const {valueField} = this.props
    return valueExistInSelected(option[valueField], this.props)
  }

  areAllSelected() {
    return (
      this.state.values.length ===
      this.props.options.filter(option => !option.disabled).length
    )
  }

  safeString(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  sortBy() {
    const {sortBy, options} = this.props

    if (!sortBy) {
      return options
    }

    options.sort((a, b) => {
      if (getProp(a, sortBy) < getProp(b, sortBy)) {
        return -1
      } else if (getProp(a, sortBy) > getProp(b, sortBy)) {
        return 1
      } else {
        return 0
      }
    })

    return options
  }

  searchFn({state, methods}) {
    const regexp = new RegExp(methods.safeString(state.search), 'i')

    return methods
      .sortBy()
      .filter(item =>
        regexp.test(
          getByPath(item, this.props.searchBy) ||
            getByPath(item, this.props.valueField)
        )
      )
  }

  searchResults() {
    const args = {
      state: this.state,
      props: this.props,
      methods: this.methods
    }

    return this.props.searchFn(args) || this.searchFn(args)
  }

  activeCursorItem(activeCursorItem) {
    return this.setState({
      activeCursorItem
    })
  }

  handleKeyDown(event) {
    log('handleKeyDown')
    const {cursor} = this.state

    if (event.key === 'ArrowDown' && cursor === null) {
      return this.setState({
        cursor: 0
      })
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
    }

    if (event.key === 'Escape') {
      this.dropDown('close')
    }

    if (event.key === 'Enter') {
      const currentItem = this.searchResults()[cursor]
      if (currentItem && !currentItem.disabled) {
        if (
          this.props.create &&
          valueExistInSelected(this.state.search, this.props)
        ) {
          return null
        }

        this.addItem(currentItem)
      }
    }

    if (event.key === 'ArrowUp' && cursor > 0) {
      this.setState(prevState => ({
        cursor: prevState.cursor - 1
      }))
    }

    if (event.key === 'ArrowUp' && cursor === 0) {
      this.setState({
        cursor: this.searchResults().length
      })
    }

    if (event.key === 'ArrowDown') {
      this.setState(prevState => ({
        cursor: prevState.cursor + 1
      }))
    }

    if (
      event.key === 'ArrowDown' &&
      this.searchResults().length === cursor
    ) {
      return this.setState({
        cursor: 0
      })
    }
  }

  renderDropdown(classes) {
    return this.props.portal ? (
      ReactDOM.createPortal(
        <Dropdown
          classes={classes}
          props={this.props}
          state={this.state}
          methods={this.methods}
        />,
        this.dropdownRoot
      )
    ) : (
      <Dropdown
        classes={classes}
        props={this.props}
        state={this.state}
        methods={this.methods}
      />
    )
  }

  createNew(item) {
    const newValue = {
      [this.props.labelField]: item,
      [this.props.valueField]: item
    }

    this.addItem(newValue)
    this.props.onCreateNew(newValue)
    this.setState({search: ''})
  }

  render() {
    const {
      contentRenderer,
      multi,
      valueField,
      labelField,
      value,
      options
    } = this.props
    const {focused} = this.state
    const classes = extractClassesByComponent(this.props.className)
    // log('render', classes, this.props)
    return (
      <ClickOutside
        onClickOutside={event => {
          this.dropDown('close', event)
        }}
        dropdownRoot={this.dropdownRoot}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            direction: this.props.direction,
            ...(this.props.style || {})
          }}
          onKeyDown={this.handleKeyDown}
          // onClick={event => this.dropDown('open', event)}
          // tabIndex="0"
          ref={this.select}
          disabled={this.props.disabled}
          className={cn(classes.container, {
            'shadow-outline': focused
          })}
        >
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexWrap: 'wrap'
            }}
            className={cn(classes.content, {
              [classes['content-single']]: !multi,
              [classes['content-multi']]: multi
            })}
            // onClick={() => this.methods.dropDown('open')}
            onFocus={() => {
              if (!this.doNotOpenOnFocus) {
                this.methods.dropDown('open')
              }
              this.doNotOpenOnFocus = false
              this.setState({focused: true})
            }}
            onBlur={() => this.setState({focused: false})}
          >
            {contentRenderer ? (
              contentRenderer({
                props: this.props,
                state: this.state,
                methods: this.methods
              })
            ) : (
              <React.Fragment>
                {value &&
                  value.length > 0 &&
                  (multi ? (
                    value.split(',').map(value => {
                      const item =
                        options.find(
                          option => option[valueField] === value
                        ) || {}
                      return (
                        <Option
                          key={item[valueField]}
                          item={item}
                          state={this.state}
                          props={this.props}
                          methods={this.methods}
                        />
                      )
                    })
                  ) : (
                    <span>
                      {(options.find(
                        option => option[valueField] === value
                      ) || {})[labelField] || ''}
                    </span>
                  ))}
                <Input
                  className={cn(classes.input, 'focus:outline-none')}
                  props={this.props}
                  methods={this.methods}
                  state={this.state}
                />
              </React.Fragment>
            )}
          </div>

          {this.props.name && (
            <input
              name={this.props.name}
              type="hidden"
              tabIndex="-1"
              value={this.props.values}
            />
          )}

          {this.props.loading && <Loading props={this.props} />}

          {this.props.clearable && (
            <Clear
              className={classes.clear}
              props={this.props}
              state={this.state}
              methods={this.methods}
            />
          )}

          {this.props.separator && (
            <Separator
              props={this.props}
              state={this.state}
              methods={this.methods}
            />
          )}

          {this.props.dropdownHandle && (
            <DropdownHandle
              onClick={() => this.select.current.focus()}
              dropdownHandleRenderer={
                this.props.dropdownHandleRenderer
              }
              isDropdownOpen={this.state.dropdown}
              methods={this.methods}
            />
          )}

          {this.state.dropdown && this.renderDropdown(classes)}
        </div>
      </ClickOutside>
    )
  }
}

Select.propTypes = {
  onChange: PropTypes.func.isRequired,
  onDropdownClose: PropTypes.func,
  onDropdownOpen: PropTypes.func,
  onClearAll: PropTypes.func,
  onSelectAll: PropTypes.func,
  values: PropTypes.array,
  options: PropTypes.array.isRequired,
  keepOpen: PropTypes.bool,
  dropdownGap: PropTypes.number,
  multi: PropTypes.bool,
  placeholder: PropTypes.string,
  addPlaceholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  loading: PropTypes.bool,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  separator: PropTypes.bool,
  dropdownHandle: PropTypes.bool,
  searchBy: PropTypes.string,
  sortBy: PropTypes.string,
  closeOnScroll: PropTypes.bool,
  openOnTop: PropTypes.bool,
  style: PropTypes.object,
  contentRenderer: PropTypes.func,
  dropdownRenderer: PropTypes.func,
  itemRenderer: PropTypes.func,
  noDataRenderer: PropTypes.func,
  optionRenderer: PropTypes.func,
  inputRenderer: PropTypes.func,
  loadingRenderer: PropTypes.func,
  clearRenderer: PropTypes.func,
  separatorRenderer: PropTypes.func,
  dropdownHandleRenderer: PropTypes.func,
  direction: PropTypes.string
}

Select.defaultProps = {
  addPlaceholder: '',
  placeholder: 'Select...',
  values: [],
  options: [],
  multi: false,
  disabled: false,
  searchBy: 'label',
  sortBy: null,
  clearable: false,
  searchable: true,
  dropdownHandle: true,
  separator: false,
  keepOpen: undefined,
  noDataLabel: 'No data',
  createNewLabel: 'add {search}',
  disabledLabel: 'disabled',
  dropdownGap: 1,
  closeOnScroll: false,
  debounceDelay: 0,
  labelField: 'label',
  valueField: 'value',
  color: '#0074D9',
  keepSelectedInList: true,
  closeOnSelect: false,
  clearOnBlur: true,
  clearOnSelect: true,
  dropdownPosition: 'bottom',
  dropdownHeight: '300px',
  autoFocus: false,
  portal: null, // document.body,
  create: false,
  direction: 'ltr',
  name: null,
  onChange: () => undefined,
  onDropdownOpen: () => undefined,
  onDropdownClose: () => undefined,
  onClearAll: () => undefined,
  onSelectAll: () => undefined,
  onCreateNew: () => undefined,
  searchFn: () => undefined
}

export default Select
