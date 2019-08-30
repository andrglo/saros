const path = require('path')
const glob = require('glob')

const SYSTEM = 'system'

module.exports = function themesLoader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for themes is async')
    process.exit(1)
  }

  const themesFiles = glob.sync(
    path.join(__dirname, '../assets/themes/*.js')
  )

  let themes = `[{label: 'theme system', value: '${SYSTEM}'}`
  for (const fullName of themesFiles) {
    // eslint-disable-next-line import/no-dynamic-require
    const theme = require(fullName)
    themes = `${themes}, {label: '${
      theme.name
    }', value: '${path.basename(fullName, '.js')}'}`
  }
  themes = `${themes}]`

  const source = `
    export default ${themes}
  `
  callback(null, source)
}
