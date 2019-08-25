const colors = require('../colors')

module.exports = {
  name: 'theme dark', // t`theme dark`
  colors: {
    highlight: 'rgba(255,255,255,.3)',

    'text-default': colors.gray[300],
    'bg-default': colors.gray[900],

    'text-error': colors.red[600],
    'bg-error': colors.red[200],

    'text-warning': colors.yellow[400],
    'bg-warning': colors.yellow[900],

    'text-info': colors.green[300],
    'bg-info': colors.green[900],

    'text-toolbar': colors.blue[200],
    'bg-toolbar': colors.blue[900],

    'text-drawer': colors.gray[400],
    'bg-drawer': colors.gray[800],

    'text-primary': colors.white,
    'bg-primary': colors.gray[600],

    'text-secondary': colors.pink[200],
    'bg-secondary': colors.pink[600],

    'text-tertiary': colors.purple[200],
    'bg-tertiary': colors.purple[600],

    'text-contrast': colors.red[300],
    'bg-contrast': colors.orange[600],

    'border-default': colors.gray[700],
    'border-highlight': colors.gray[400],

    'bg-menu': colors.gray[800],
    'bg-menu-focused': colors.gray[600],
    'bg-menu-selected': colors.gray[700],

    income: colors.blue[400],
    expense: colors.red[400]
  }
}
