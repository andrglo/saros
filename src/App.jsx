import React, {Component, Suspense} from 'react'
import {hot} from 'react-hot-loader/root'
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
import t, {fetchLocale} from './lib/translate'

import getView from './loaders/router!'
import {getQuery} from './lib/history'

const log = debug('app')

const Dashboard = React.lazy(() => import('./Dashboard.jsx'))
const Presentation = React.lazy(() => import('./Presentation'))
const Agreement = React.lazy(() => import('./Agreement.jsx'))
const Privacy = React.lazy(() => import('./Privacy.jsx'))
const Signin = React.lazy(() => import('./Signin.jsx'))

const LIGHT = 'light'
const DARK = 'dark'
const SYSTEM = 'system'

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

  componentDidUpdate(prevProps) {
    const {theme, locale} = this.props
    if (
      theme !== prevProps.theme ||
      process.env.NODE_ENV === 'development'
    ) {
      App.setTheme(theme, this.state.colorScheme)
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
            let [color, ...shades] = colors[key]
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
          <div className="w-screen h-screen">
            <div className="w-full h-full bg-default text-default">
              {getView(pathname)}
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
    return <Dashboard>{getView(pathname)}</Dashboard>
  }

  render() {
    log('render', this.props)
    const {updateAvailable} = this.props
    const {locale} = this.state
    return (
      <React.StrictMode key={locale}>
        <Suspense
          fallback={
            <div className="bg-default h-screen grid justify-center items-center">
              <div
                className="spinner-4"
                style={{
                  transform: 'translateX(-1em) translateY(-3em)'
                }}
              />
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
    if (
      browserLocation !== window.location &&
      browserLocation.pathname !==
        window.location.pathname + window.location.search
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
})(hot(App))
