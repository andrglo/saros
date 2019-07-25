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
    'no-console': 0,
    'no-shadow': 0,
    'no-restricted-syntax': 0,
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    'prefer-destructuring': 0,
    'prefer-const': ['error', {destructuring: 'all'}],
    'no-use-before-define': 0,
    'no-nested-ternary': 0,
    'import/no-webpack-loader-syntax': 0,
    'import/no-unresolved': 0,
    'react/jsx-wrap-multilines': [
      'error',
      {
        declaration: 'parens',
        assignment: 'parens',
        return: 'parens',
        arrow: 'parens',
        condition: 'parens',
        logical: 'parens',
        prop: 'ignore'
      }
    ],
    'no-loop-func': 0,
    'import/prefer-default-export': 0,
    'import/no-named-as-default-member': 0,
    'react/forbid-prop-types': 0,
  }
}
