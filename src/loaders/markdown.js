const fs = require('fs')
const marked = require('marked')

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for markdown is async')
    process.exit(1)
  }

  const convertoToHtml = async filename => {
    const contents = (await fs.promises.readFile(filename)).toString()
    return marked(contents)
  }
  convertoToHtml(this.resourcePath).then(html => {
    const source = `
    import React from 'react'

    export default () => {
      return (
        <div className="markdown" >
          ${html}
        </div>
      )
    }
    `
    callback(null, source)
  })
}
