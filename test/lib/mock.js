const fs = require('fs')
const path = require('path')
const glob = require('glob')

require('../../src/lib/polyfill')

const addHook = require('pirates').addHook

const mockInitialization = `
Object.defineProperty(exports, '__esModule', {
  value: true
})
const utils = {
  showCall: name => (...args) => {
    console.log(\`function \${name} called in mock with args:\`, args)
  },
  noop: () => {}
};
`

const mockFiles = glob
  .sync(path.join(__dirname, '../mocks/**/*.@(js|jsx)'))
  .map(filename => filename.match(/\/mocks(\/.+)$/)[1])

const mock = (code, filename) => {
  for (const file of mockFiles) {
    if (filename.endsWith(file)) {
      code = fs
        .readFileSync(path.join(__dirname, `../mocks${file}`))
        .toString()
      return mockInitialization + code
    }
  }
  throw new Error(`Mock file not found: ${filename}`)
}

const matcher = filename => {
  for (const file of mockFiles) {
    if (filename.endsWith(file)) {
      return true
    }
  }
  return false
}

addHook(mock, {exts: ['.js'], matcher, ignoreNodeModules: true})
