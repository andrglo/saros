// @codegen

const {execSync} = require('child_process')
const pack = require('../../package.json')

const stdout = execSync('git rev-parse HEAD')
const revision = stdout.toString().substring(0, 6)

module.exports = `
  export const version='${pack.version}'
  export const revision='${revision}'
`
