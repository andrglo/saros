import React, {Component} from 'react'
import PropTypes from 'prop-types'
import debug from 'debug'

import {valueExistInSelected} from './util'

const log = debug('select:input')

class Input extends Component {
  constructor(props) {
    super(props)

    this.onBlur = this.onBlur.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)

    this.input = React.createRef()
  }

  // componentDidUpdate(prevProps) {
  //   if (
  //     this.props.state.dropdown ||
  //     (prevProps.state.dropdown !== this.props.state.dropdown &&
  //       this.props.state.dropdown) ||
  //     this.props.props.autoFocus
  //   ) {
  //     this.input.current.focus()
  //   }

  //   if (
  //     prevProps.state.dropdown !== this.props.state.dropdown &&
  //     !this.props.state.dropdown
  //   ) {
  //     this.input.current.blur()
  //   }
  // }

  onBlur() {
    if (!this.props.state.dropdown) {
      return this.input.current.blur()
    }

    return this.input.current.focus()
  }

  handleKeyPress(event) {
    const {props, state, methods} = this.props

    return (
      props.create &&
      event.key === 'Enter' &&
      !valueExistInSelected(state.search, this.props) &&
      state.search &&
      state.cursor === null &&
      methods.createNew(state.search)
    )
  }

  render() {
    const {className, props, state, methods} = this.props

    if (props.inputRenderer) {
      return props.inputRenderer({
        props,
        state,
        methods,
        inputRef: this.input
      })
    }

    const style = {
      lineHeight: 'inherit',
      backgroundColor: 'inherit',
      width: `calc(${methods.getInputSize()}ch + 5px)`
    }
    const readOnly = !props.searchable
    if (readOnly) {
      style.cursor = 'pointer'
    }

    return (
      <input
        ref={this.input}
        style={style}
        // tabIndex="-1"
        className={className}
        value={state.search}
        // onFocus={() => {
        //   log('onFocus')
        //   methods.dropDown('open')
        // }}
        // onKeyPress={this.handleKeyPress}
        onChange={methods.setSearch}
        // onBlur={this.onBlur}
        onBlur={() => {
          log('onBlur')
          methods.dropDown('close')
        }}
        placeholder={props.value === '' ? '' : props.addPlaceholder}
      />
    )
  }
}

Input.propTypes = {
  className: PropTypes.string,
  props: PropTypes.object,
  state: PropTypes.object,
  methods: PropTypes.object
}

export default Input
