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
  extends: [
    'airbnb',
    'prettier',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  plugins: ['prettier', 'react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
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
    'jsx-a11y/label-has-for': 0, // deprecated
    'jsx-a11y/no-autofocus': 0, // did not understand why
    'prefer-template': 0,
    'jsx-a11y/interactive-supports-focus': 0, // Many cases the support for focus should only be in the children
    'no-plusplus': 0,
    'default-case': 0,
    'no-continue': 0,
    'require-atomic-updates': 0,
    'react/destructuring-assignment': 0,
    'consistent-return': 0,
    'no-cond-assign': 0,
    'react/sort-comp': 0,
    'react/jsx-props-no-spreading': 0,
    'react/jsx-fragments': 0,
    'react/state-in-constructor': 0,
    'react/no-array-index-key': 0,
    'react/button-has-type': 0,
    'no-multi-assign': 0,
  }
}
