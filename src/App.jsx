import React, {Component, Suspense} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'
import serializeError from 'serialize-error'

import './index.css'
import {setError} from './reducers/app'
import {getUid, getUpdateAvailable} from './selectors/app'
import {updateApp} from './controller'
import Alert from './components/Alert'
import t from './lib/translate'

const log = debug('app')

const Dashboard = React.lazy(() => import('./Dashboard'))
const Signin = React.lazy(() => import('./Signin'))

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidCatch(err, info) {
    log('componentDidCatch', err, info)
    const {dispatch} = this.props
    dispatch(
      setError({message: serializeError(err), info, home: true})
    )
  }

  render() {
    log('render', this.props)
    const {uid, updateAvailable} = this.props
    return (
      <React.StrictMode>
        <Suspense
          fallback={
            <div className="container mx-auto h-screen flex justify-center items-center">
              <div className="w-1/3 spinner" />
            </div>
          }
        >
          {uid ? <Dashboard /> : <Signin />}
          {updateAvailable && (
            <Alert
              title={t`Update available!`}
              message={t`Update now?`}
              buttonCaption={t`Yes`}
              onClick={updateApp}
            />
          )}
        </Suspense>
      </React.StrictMode>
    )
  }
}

App.propTypes = {
  dispatch: PropTypes.func.isRequired,
  uid: PropTypes.string,
  updateAvailable: PropTypes.bool
}

export default connect(state => {
  return {
    uid: getUid(state),
    updateAvailable: getUpdateAvailable(state)
  }
})(App)
