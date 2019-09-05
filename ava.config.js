const config = {
  require: ['@babel/register', './ava.browser.config.js'],
  babel: {
    extensions: ['js', 'jsx']
  },
  files: ['**/test/**/*.js', '!test/data', '!test/lib', '!test/mocks']
}

export default config
