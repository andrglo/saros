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
import {getQuery} from './lib/history'

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

  renderView() {
    const {uid, browserLocation = {}} = this.props
    let pathname =
      browserLocation.pathname || window.location.pathname
    switch (pathname) {
      case '/agreement':
        return <Agreement />
      case '/privacy':
        return <Privacy />
      case '/signin':
        if (!uid) {
          return <Signin />
        }
        pathname = '/'
    }
    if (!uid) {
      return <Presentation />
    }
    if (process.env.NODE_ENV === 'development') {
      const query = getQuery(browserLocation)
      if ('frame' in query) {
        return (
          <div className="w-screen h-screen p-1">
            <div className="shadow-outline w-full h-full bg-default text-default">
              {getView(pathname)}
            </div>
          </div>
        )
      }
    }
    return <Dashboard>{getView(pathname)}</Dashboard>
  }

  render() {
    log('render', this.props)
    const {updateAvailable, locale} = this.props
    return (
      <React.StrictMode key={locale}>
        <Suspense
          fallback={
            <div className="container mx-auto h-screen flex justify-center items-center">
              <div className="w-1/3 spinner" />
            </div>
          }
        >
          {this.renderView()}
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
  const browserLocation = getBrowserLocation(state)
  if (process.env.NODE_ENV === 'development') {
    if (browserLocation.pathname !== window.location.pathname) {
      console.error(
        'browserLocation pathname mismatch',
        browserLocation,
        window.location
      )
    }
  }
  return {
    uid: getUid(state),
    updateAvailable: getUpdateAvailable(state),
    theme: getTheme(state),
    locale: getLocale(state),
    browserLocation
  }
})(App)
