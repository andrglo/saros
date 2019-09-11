/* eslint-disable import/no-dynamic-require */
const path = require('path')
const glob = require('glob')

module.exports = db => {
  const docs = {}
  const files = glob.sync(path.join(__dirname, `./${db}/**.json`))
  for (const file of files) {
    const name = path.basename(file, '.json')
    const data = require(file)
    for (const id of Object.keys(data)) {
      const record = data[id]
      if (record.updatedAt) {
        record.updatedAt = new Date(record.updatedAt).getTime()
      }
      if (record.createdAt) {
        record.createdAt = new Date(record.createdAt).getTime()
      }
      delete record.keywords
      delete record.monthSpan
    }
    docs[`dbs/${db}/${name}`] = {data}
  }
  return docs
}
