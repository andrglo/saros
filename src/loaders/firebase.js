const {exec} = require('child_process')

let firebaseConfig

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for firebase is async')
    process.exit(1)
  }
  const sendSource = () => {
    callback(null, `export default ${firebaseConfig || '{}'}`)
  }
  if (!firebaseConfig) {
    exec('firebase setup:web', (err, stdout) => {
      if (err) {
        callback(err)
        return
      }
      const match = stdout
        .toString()
        .match(/firebase\.initializeApp\(([^)]+)\)/m)
      if (match) {
        firebaseConfig = match[1]
      }
      sendSource()
    })
  } else {
    sendSource()
  }
}
