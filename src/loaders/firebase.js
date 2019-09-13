// @codegen

let firebaseConfig

if (process.env.NODE_ENV !== 'test') {
  const {execSync} = require('child_process')
  const stdout = execSync('firebase setup:web')
  const match = stdout
    .toString()
    .match(/firebase\.initializeApp\(([^)]+)\)/m)
  if (match) {
    firebaseConfig = match[1]
  }
}

module.exports = `export default ${firebaseConfig || '{}'}`
