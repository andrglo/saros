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

    const Dashboard = React.lazy(() => import('${__dirname}/../Dashboard.jsx'))
    const Presentation = React.lazy(() => import('${__dirname}/../Presentation'))
    ${imports.join('\n')}

    export default (uid, browserLocation = {pathname: window.location.pathname}) => {
      const pathname = browserLocation.pathname
      console.log('pathname in routes loader', pathname)
      if (!uid && pathname !== '/signin') {
        return React.createElement(Presentation)
      }
      if (pathname === '/') {
        return React.createElement(Dashboard)
      }
      switch (pathname) {
        ${routes.join('\n')}
        default:
          return 'Route not found'
      }
    }
  `

  callback(null, source)
}
