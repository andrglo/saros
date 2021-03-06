import React, {Component, Suspense} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'
import {serializeError} from 'serialize-error'

import './index.css'
import './lib/polyfill'

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
import t, {fetchLocale} from './lib/translate'

import getView from './loaders/router'
import {getQuery} from './lib/history'
import usePreviousValue from './hooks/usePreviousValue'
import {ArrowBackIcon} from './assets/icons'
import {pushBrowserLocation} from './actions/app'

const log = debug('app')

const Workspace = React.lazy(() => import('./Workspace.jsx'))
const Dashboard = React.lazy(() => import('./Dashboard'))
const Presentation = React.lazy(() => import('./Presentation'))
const Agreement = React.lazy(() => import('./Agreement.jsx'))
const Privacy = React.lazy(() => import('./Privacy.jsx'))
const Signin = React.lazy(() => import('./Signin.jsx'))

const LIGHT = 'light'
const DARK = 'dark'
const SYSTEM = 'system'

const Fallback = props => (
  <div
    className={cn(
      'h-full grid justify-center items-center',
      props.className
    )}
  >
    <div
      className="spinner-4"
      style={{
        transform: 'translateX(-1em) translateY(-3em)'
      }}
    />
  </div>
)

Fallback.propTypes = {
  className: PropTypes.string
}

const View = props => {
  const {location, dispatch} = props
  const panel = getView(location)
  const dashboardPath = '/dashboard/'
  const showDashboard =
    !panel ||
    (location.pathname.startsWith(dashboardPath) &&
      location.pathname.length > dashboardPath.length)
  const thereIsRightPanel = Boolean(panel && showDashboard)
  const previousDashboardRightPanel = usePreviousValue(
    showDashboard && panel
  )
  let dashboardClass
  const shouldScrollDashboard =
    showDashboard &&
    (thereIsRightPanel || previousDashboardRightPanel)
  if (shouldScrollDashboard) {
    dashboardClass = thereIsRightPanel
      ? 'slide-out-left'
      : 'slide-in-left'
  }
  return (
    <div className="flex">
      {showDashboard && <Dashboard className={dashboardClass} />}
      {shouldScrollDashboard ? (
        <div
          className={cn(
            'absolute w-full top-0 bg-default text-default',
            {
              'slide-in-right': Boolean(panel),
              'slide-out-right': !panel
            }
          )}
        >
          <button
            className="btn absolute top-0 left-0 ml-1 mt-1 p-0 h-10 w-10 rounded-full border-0 shadow-none"
            onClick={() => {
              dispatch(pushBrowserLocation('/'))
            }}
          >
            <ArrowBackIcon className="h-6 w-6 mx-auto" />
          </button>
          {panel || previousDashboardRightPanel}
        </div>
      ) : (
        panel
      )}
    </div>
  )
}

View.propTypes = {
  dispatch: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired
}

class App extends Component {
  constructor(props) {
    super(props)
    this.setColorScheme = this.setColorScheme.bind(this)
    this.state = {
      colorScheme: LIGHT,
      locale: props.locale
    }
  }

  componentDidMount() {
    const {theme} = this.props
    this.darkSchemeQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    )
    this.darkSchemeQuery.addListener(this.setColorScheme)
    this.setColorScheme()
    App.setTheme(theme, this.state.colorScheme)
  }

  componentDidUpdate(prevProps, prevState) {
    const {theme, locale} = this.props
    const {colorScheme} = this.state
    if (
      theme !== prevProps.theme ||
      colorScheme !== prevState.colorScheme ||
      process.env.NODE_ENV === 'development'
    ) {
      App.setTheme(theme, colorScheme)
    }
    if (locale !== prevProps.locale) {
      fetchLocale(locale).then(() => {
        this.setState({locale})
      })
    }
  }

  static setTheme(theme, colorScheme) {
    const file = !theme || theme === SYSTEM ? colorScheme : theme
    import(`./assets/themes/${file}`)
      .then(({colors}) => {
        for (const key of Object.keys(colors)) {
          if (Array.isArray(colors[key])) {
            const [color, ...shades] = colors[key]
            const variants = ['hover', 'active']
            shades.forEach((shade, i) => {
              document.documentElement.style.setProperty(
                `--color-${key}${
                  i === 0 ? '' : `-${variants[i - 1] || i}`
                }`,
                color[shade]
              )
            })
          } else {
            document.documentElement.style.setProperty(
              `--color-${key}`,
              colors[key]
            )
          }
        }
      })
      .catch(err => {
        console.error(err)
      })
  }

  componentWillUnmount() {
    this.darkSchemeQuery.removeListener(this.setColorScheme)
  }

  setColorScheme() {
    this.setState({
      colorScheme: this.darkSchemeQuery.matches ? DARK : LIGHT
    })
  }

  componentDidCatch(err, info) {
    log('componentDidCatch', err, info)
    const {dispatch} = this.props
    dispatch(
      setError({message: serializeError(err), info, home: true})
    )
  }

  renderView() {
    const {uid, browserLocation = {}, dispatch} = this.props
    let location = browserLocation || window.location
    switch (location.pathname) {
      case '/agreement':
        return <Agreement />
      case '/privacy':
        return <Privacy />
      case '/signin':
        if (!uid) {
          return <Signin />
        }
        location = {pathname: '/'}
    }
    if (!uid) {
      return <Presentation />
    }
    if (process.env.NODE_ENV === 'development') {
      const query = getQuery(browserLocation)
      if ('frame' in query) {
        return (
          <div className="w-screen h-screen">
            <div className="w-full h-full bg-default text-default">
              {getView(location) || <Dashboard />}
            </div>
          </div>
        )
      }
      const {component} = query
      if (component) {
        const Component = React.lazy(() =>
          import(
            /* webpackExclude: /test\/.+\.jsx?$/ */
            `./components/${component}.jsx`
          )
        )
        const compProps =
          this.state.compProps || `{\n  "className": "m-12"\n}`
        return (
          <React.Fragment>
            <Component {...JSON.parse(compProps)} />
            <div className="w-screen p-4">
              <textarea
                className="w-full h-40 text-default bg-default border border-b"
                value={
                  this.state.compProps ||
                  `{\n  "className": "m-12"\n}`
                }
                onChange={event => {
                  this.setState({compProps: event.target.value})
                }}
              />
            </div>
          </React.Fragment>
        )
      }
    }
    return (
      <Workspace>
        <Suspense fallback={<Fallback />}>
          <View location={location} dispatch={dispatch} />
        </Suspense>
      </Workspace>
    )
  }

  render() {
    log('render', this.props)
    const {updateAvailable} = this.props
    const {locale} = this.state
    return (
      <React.StrictMode key={locale}>
        <Suspense
          fallback={<Fallback className="bg-default h-screen" />}
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
    let pathname = browserLocation.pathname
    if (browserLocation.query) {
      const qs = require('query-string')
      pathname += '?' + qs.stringify(browserLocation.query || {})
    }
    if (
      browserLocation !== window.location &&
      pathname !== window.location.pathname + window.location.search
    ) {
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
