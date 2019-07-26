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
    html = html.replace(/<p>/g, '<p className="block my-1 mx-0" >')
    html = html.replace(
      /<blockquote>/g,
      '<blockquote className="block my-2 mx-1" >'
    )
    html = html.replace(
      /<h1>/g,
      '<h1 className="block text-3xl mx-0 my-3" >'
    )
    html = html.replace(
      /<h1 /g,
      '<h1 className="block text-3xl mx-0 my-3" '
    )
    const source = `
    import React from 'react'

    export default () => {
      return (
        <React.Fragment>
          ${html}
        </React.Fragment>
      )
    }
    `
    callback(null, source)
  })
}
