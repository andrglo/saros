import React from 'react'
import PropTypes from 'prop-types'

const Clear = props => {
  const {
    className,
    props: {clearRenderer},
    state,
    methods
  } = props
  return clearRenderer ? (
    clearRenderer({className, props: props.props, state, methods})
  ) : (
    <div
      className={className}
      tabIndex="-1"
      role="button"
      onClick={() => methods.clearAll()}
      onKeyPress={() => methods.clearAll()}
    >
      &times;
    </div>
  )
}

Clear.propTypes = {
  className: PropTypes.string.isRequired,
  props: PropTypes.object,
  state: PropTypes.object,
  methods: PropTypes.object
}

export default Clear
