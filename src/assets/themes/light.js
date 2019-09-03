const colors = require('../colors')

module.exports = {
  name: 'theme light', // t`theme light` t`theme system`
  colors: {
    highlight: 'rgba(0,0,0,.1)',

    // shades: default hover active
    'text-default': [colors.gray, 900, 100, 800],
    'bg-default': [colors.gray, 100, 500, 300],

    'text-error': colors.red[900],
    'bg-error': colors.red[400],

    'text-warning': colors.yellow[900],
    'bg-warning': colors.yellow[400],

    'text-info': colors.green[900],
    'bg-info': colors.green[400],

    'text-toolbar': colors.teal[100],
    'bg-toolbar': '#2d6987',

    'text-drawer': colors.teal[900],
    'bg-drawer': '#c7e3f1',

    'text-primary': [colors.blue, 100, 900, 800],
    'bg-primary': [colors.blue, 600, 400, 200],

    'text-secondary': [colors.pink, 100, 900, 800],
    'bg-secondary': [colors.pink, 600, 400, 200],

    'text-tertiary': [colors.purple, 100, 900, 800],
    'bg-tertiary': [colors.purple, 600, 400, 200],

    'text-contrast': colors.yellow[900],
    'bg-contrast': colors.yellow[400],

    'border-default': colors.gray[400],
    'border-highlight': colors.black,

    'bg-menu': colors.blue[100],
    'bg-menu-focused': colors.blue[200],
    'bg-menu-selected': colors.blue[300],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
