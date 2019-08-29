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

  const root = path.resolve(__dirname, '../pages')
  const routesFiles = glob
    .sync(path.join(__dirname, '../pages/**/*.jsx'))
    .filter(dir => !dir.includes('test'))

  const imports = []
  const routes = []
  for (const fullName of routesFiles) {
    const name = path.basename(fullName, '.jsx')
    imports.push(
      `const ${name} = React.lazy(() => import('${path.resolve(
        '../pages/',
        fullName
      )}'))`
    )
    const route =
      path.dirname(fullName.substring(root.length)) +
      normalize(kebabCase(name))
    routes.push(
      `case '${route}': {
        return React.createElement(${name}, {pathname: url.pathname, search: url.search})
      }`
    )
  }

  const source = `
    import React from 'react'
    const PageNotFound = React.lazy(() => import('${__dirname}/../PageNotFound.jsx'))
    ${imports.join('\n')}
    export default pathname => {
      const url = new URL(pathname, window.location.origin)
      switch (url.pathname) {
        case '/':
        case '/index.html':
          return null
        ${routes.join('\n')}
        default:
          return React.createElement(PageNotFound)
      }
    }
  `
  callback(null, source)
}
