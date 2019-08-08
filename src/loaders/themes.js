const path = require('path')
const glob = require('glob')

module.exports = function themesLoader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for routes is async')
    process.exit(1)
  }

  const themesFiles = glob.sync(
    path.join(__dirname, '../assets/themes/*.js')
  )

  const themes = []
  for (const fullName of themesFiles) {
    // eslint-disable-next-line import/no-dynamic-require
    const theme = require(fullName)
    themes.push({
      label: theme.name,
      value: path.basename(fullName, '.js')
    })
  }

  const source = `
    export default ${JSON.stringify(themes)}
  `
  callback(null, source)
}
