module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: ['airbnb', 'prettier'],
  plugins: ['prettier', 'react-hooks'],
  rules: {
    'prettier/prettier': ['error'],
    'import/no-extraneous-dependencies': 0,
    'react/require-default-props': 0,
    'global-require': 0,
    'no-console': 0
  }
}
