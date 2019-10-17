// @codegen

const path = require('path')
const glob = require('glob')
const kebabCase = require('lodash/kebabCase')

const normalize = require('../lib/normalize')

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
  const route = path.join(
    path.dirname(fullName.substring(root.length)),
    normalize(kebabCase(name))
  )
  routes.push(
    `case '${route}': {
        return React.createElement(${name}, props)
      }`
  )
}

const source = `
    import React from 'react'
    import qs from 'query-string'
    const PageNotFound = React.lazy(() => import('${__dirname}/../PageNotFound.jsx'))
    ${imports.join('\n')}
    export default location => {
      let url
      let pathname = location.pathname
      if (location.query) {
        pathname= \`\${pathname}?\${qs.stringify(location.query)}\`
      } else if (location.search) {
        pathname = pathname + location.search
      }
      if (process.env.NODE_ENV === 'test') {
        url = {pathname}
      } else {
        url = new URL(pathname, window.location.origin)
      }
      const props = {
        pathname: url.pathname
      }
      if (url.search) {
        props.query = qs.parse(url.search)
      }
      switch (url.pathname) {
        case '/':
        case '/dashboard':
        case '/dashboard/':
        case '/index.html':
          return null
        ${routes.join('\n')}
        default:
          return React.createElement(PageNotFound)
      }
    }
  `

module.exports = source
