import React, {Component, Suspense} from 'react'
import {hot} from 'react-hot-loader/root'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'
import serializeError from 'serialize-error'

import './index.css'
import colors from './assets/colors'
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

const themeColors = [
  ['color-text-default', colors.black, colors.teal[100]],
  ['color-bg-default', colors.teal[100], colors.teal[900]],

  ['color-text-input', colors.teal[900], colors.gray[200]],
  ['color-bg-input', colors.teal[100], colors.teal[900]],
  ['color-bg-input-highlight', colors.teal[200], colors.teal[700]],

  ['color-text-error', colors.red[900], colors.red[100]],
  ['color-bg-error', colors.red[100], colors.red[900]],

  ['color-text-placeholder', colors.gray[600], colors.gray[700]],

  ['color-text-toolbar', colors.teal[900], colors.teal[200]],
  ['color-bg-toolbar', colors.teal[100], colors.teal[900]],

  ['color-text-drawer', colors.teal[900], colors.teal[200]],
  ['color-bg-drawer', colors.teal[200], colors.teal[800]],

  ['color-border-default', colors.teal[300], colors.teal[700]],
  ['color-border-highlight', colors.teal[700], colors.teal[500]],

  ['color-text-menu', colors.teal[900], colors.teal[200]],
  ['color-bg-menu', colors.teal[200], colors.teal[800]],
  ['color-bg-menu-highlight', colors.teal[400], colors.teal[700]],
  ['color-bg-menu-selected', colors.blue[400], colors.blue[600]],

  ['color-income', colors.blue[600], colors.blue[400]],
  ['color-expense', colors.red[600], colors.red[400]]
]

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
    const isDark = theme === 'dark'
    for (const [name, lightColor, darkColor] of themeColors) {
      document.documentElement.style.setProperty(
        `--${name}`,
        isDark ? darkColor : lightColor
      )
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
})(hot(App))
