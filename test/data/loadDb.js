/* eslint-disable import/no-dynamic-require */
const path = require('path')
const glob = require('glob')

module.exports = db => {
  const docs = {}
  const files = glob.sync(path.join(__dirname, `./${db}/**.json`))
  for (const file of files) {
    const name = path.basename(file, '.json')
    docs[`dbs/${db}/${name}`] = {data: require(file)}
  }
  return docs
}
