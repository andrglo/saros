const fs = require('fs')
const path = require('path')
const marked = require('marked')

module.exports = filename => `
const Markdown = () => {
  return (
    <div className="markdown" >
      ${marked(
        fs.readFileSync(path.join(__dirname, filename)).toString()
      )}
    </div>
  )
}
`
