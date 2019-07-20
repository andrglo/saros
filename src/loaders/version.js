const {execSync} = require('child_process')
const pack = require('../../package.json')

const revision = (
  process.env.COMMIT_REF ||
  execSync('git rev-parse HEAD')
    .toString()
    .trim()
).substring(0, 6)

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error(
      'Loader for storage actions/reducers configuration is async'
    )
    process.exit(1)
  }

  const source = `
    export const version='${pack.version}'
    export const revision='${revision}'
  `

  callback(null, source)
}
