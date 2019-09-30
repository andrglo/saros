// @codegen

let firebaseConfig

if (process.env.NODE_ENV !== 'test') {
  const {execSync} = require('child_process')
  const stdout = execSync(
    `firebase apps:sdkconfig web ${process.env.FIREBASE_APP_ID}`
  )
  const match = stdout
    .toString()
    .match(/firebase\.initializeApp\(([^)]+)\)/m)
  if (match) {
    firebaseConfig = match[1]
  }
}

module.exports = `export default ${firebaseConfig || '{}'}`
