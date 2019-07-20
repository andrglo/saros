import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import serializeError from 'serialize-error'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidCatch(err, info) {
    const {dispatch} = this.props
    // dispatch(fatalError(serializeError(err), {info, home: true}))
    // this.setState({info})
  }

  render() {
    const {uid} = this.props
    return <div className="text-red-600">{uid || 'No user!'}</div>
  }
}

App.propTypes = {
  dispatch: PropTypes.func.isRequired,
  uid: PropTypes.string
}

export default connect(state => {
  return {
    uid: state.app.uid
  }
})(App)
