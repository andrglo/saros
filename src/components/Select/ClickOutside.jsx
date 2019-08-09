import React from 'react'
import PropTypes from 'prop-types'
import debug from 'debug'

// eslint-disable-next-line no-unused-vars
const log = debug('select:click-outside')

class ClickOutside extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.container = React.createRef()
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick, true)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick, true)
  }

  handleClick(event) {
    const container = this.container.current
    if (container) {
      const {target} = event
      const {onClickOutside, dropdownRoot} = this.props
      // log('handleClick', {
      //   'container === target': container === target,
      //   'container.contains(target)': container.contains(target),
      //   'dropdownRoot.contains(target)': dropdownRoot.contains(target)
      // })
      if (
        container === target ||
        (!container.contains(target) &&
          !dropdownRoot.contains(target))
      ) {
        // log('handleClick => clicked outside')
        onClickOutside(event)
      }
    }
  }

  render() {
    const {children} = this.props

    return <div ref={this.container}>{children}</div>
  }
}

ClickOutside.propTypes = {
  onClickOutside: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  dropdownRoot: PropTypes.object.isRequired
}

export default ClickOutside
