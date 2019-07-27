const path = require('path')
const glob = require('glob')
const kebabCase = require('lodash/kebabCase')

const normalize = require('../lib/normalize')

module.exports = function routesLoader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for routes is async')
    process.exit(1)
  }

  const root = path.resolve(__dirname, '../routes')
  const routesFiles = glob
    .sync(path.join(__dirname, '../routes/**/*.jsx'))
    .filter(dir => !dir.includes('test'))

  const imports = []
  const routes = []
  for (const fullName of routesFiles) {
    const name = path.basename(fullName, '.jsx')
    imports.push(
      `const ${name} = React.lazy(() => import('${path.resolve(
        '../routes/',
        fullName
      )}'))`
    )
    const route =
      path.dirname(fullName.substring(root.length)) +
      kebabCase(normalize(name))
    routes.push(
      `case ('${route}'): {
        return React.createElement(${name})
      }`
    )
  }

  const source = `
    import React from 'react'
    import debug from 'debug'

    const log = debug('router')

    const Dashboard = React.lazy(() => import('${__dirname}/../Dashboard.jsx'))
    const Presentation = React.lazy(() => import('${__dirname}/../Presentation'))
    ${imports.join('\n')}

    export default (uid, publicRoutes, browserLocation = {pathname: window.location.pathname}, signinRoute = '/signin') => {
      const pathname = browserLocation.pathname
      log(pathname, uid, publicRoutes, browserLocation)
      if (!uid && !publicRoutes.includes(pathname)) {
        return React.createElement(Presentation)
      }
      if (uid && (pathname === '/' || pathname === signinRoute)) {
        return React.createElement(Dashboard)
      }
      switch (pathname) {
        ${routes.join('\n')}
        default:
          return 'Route not found!' // todo
      }
    }
  `

  callback(null, source)
}
