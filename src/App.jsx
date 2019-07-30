import React, {Component, Suspense} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'
import serializeError from 'serialize-error'

import './index.css'
import {setError} from './reducers/app'
import {
  getUid,
  getUpdateAvailable,
  getTheme,
  getLocale,
  getBrowserLocation
} from './selectors/app'
import {updateApp} from './controller'
import Alert from './components/Alert'
import t from './lib/translate'

import getView from './loaders/router!'

const log = debug('app')

const Dashboard = React.lazy(() => import('./Dashboard.jsx'))
const Presentation = React.lazy(() => import('./Presentation'))
const Agreement = React.lazy(() => import('./Agreement.jsx'))
const Privacy = React.lazy(() => import('./Privacy.jsx'))
const Signin = React.lazy(() => import('./Signin.jsx'))

class App extends Component {
  componentDidMount() {
    const {theme} = this.props
    App.setTheme(theme)
  }

  componentDidUpdate(prevProps) {
    const {theme} = this.props
    if (theme !== prevProps.theme) {
      App.setTheme(theme)
    }
  }

  static setTheme(theme) {
    const themeClass = 'theme-dark'
    if (theme === 'dark') {
      document.documentElement.classList.add(themeClass)
    } else {
      document.documentElement.classList.remove(themeClass)
    }
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
    const {
      uid,
      updateAvailable,
      locale,
      browserLocation = {}
    } = this.props
    const pathname =
      browserLocation.pathname || window.location.pathname
    let view
    switch (pathname) {
      case '/agreement':
        view = <Agreement />
        break
      case '/privacy':
        view = <Privacy />
        break
      case '/signin':
        view = <Signin />
        break
      default:
        if (!uid) {
          view = <Presentation />
        } else {
          view = <Dashboard>{getView(pathname)}</Dashboard>
        }
    }
    return (
      <React.StrictMode key={locale}>
        <Suspense
          fallback={
            <div className="container mx-auto h-screen flex justify-center items-center">
              <div className="w-1/3 spinner" />
            </div>
          }
        >
          {view}
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
  updateAvailable: PropTypes.bool,
  theme: PropTypes.string,
  locale: PropTypes.string,
  browserLocation: PropTypes.object
}

export default connect(state => {
  return {
    uid: getUid(state),
    updateAvailable: getUpdateAvailable(state),
    theme: getTheme(state),
    locale: getLocale(state),
    browserLocation: getBrowserLocation(state)
  }
})(App)
