const colors = require('../colors')

module.exports = {
  name: 'theme dark', // t`theme dark`
  colors: {
    highlight: 'rgba(255,255,255,.3)',

    // shades: default hover active
    'text-default': [colors.gray, 300, 900, 200],
    'bg-default': [colors.gray, 900, 600, 700],

    'text-error': colors.red[900],
    'bg-error': colors.red[500],

    'text-warning': colors.yellow[900],
    'bg-warning': colors.yellow[500],

    'text-info': colors.green[900],
    'bg-info': colors.green[500],

    'text-toolbar': colors.blue[200],
    'bg-toolbar': colors.blue[900],

    'text-drawer': colors.gray[400],
    'bg-drawer': colors.gray[800],

    'text-primary': [colors.blue, 100, 900, 200],
    'bg-primary': [colors.blue, 700, 300, 600],

    'text-secondary': [colors.pink, 100, 900, 200],
    'bg-secondary': [colors.pink, 700, 300, 600],

    'text-tertiary': [colors.purple, 100, 900, 200],
    'bg-tertiary': [colors.purple, 700, 300, 600],

    'text-contrast': colors.red[100],
    'bg-contrast': colors.orange[800],

    'border-default': colors.gray[700],
    'border-highlight': colors.gray[400],

    'bg-menu': colors.gray[800],
    'bg-menu-focused': colors.gray[600],
    'bg-menu-selected': colors.gray[700],

    income: colors.blue[400],
    expense: colors.red[400]
  }
}
