const {exec} = require('child_process')
const pack = require('../../package.json')

let revision

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for version is async')
    process.exit(1)
  }
  const sendSource = () => {
    const source = `
      export const version='${pack.version}'
      export const revision='${revision}'
    `
    callback(null, source)
  }
  if (!revision) {
    exec('git rev-parse HEAD', (err, stdout) => {
      if (err) {
        callback(err)
        return
      }
      revision = stdout.toString().substring(0, 6)
      sendSource()
    })
  } else {
    sendSource()
  }
}
