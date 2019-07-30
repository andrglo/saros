const {execSync} = require('child_process')

const match = execSync('firebase setup:web')
  .toString()
  .match(/firebase\.initializeApp\(([^)]+)\)/m)

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for firebase is async')
    process.exit(1)
  }

  const source = `export default ${match[1]}`

  callback(null, source)
}
