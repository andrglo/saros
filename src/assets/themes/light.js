const colors = require('../colors')

module.exports = {
  name: 'theme light', // t`theme light` t`theme system`
  colors: {
    highlight: 'rgba(0,0,0,.1)',

    'text-default': colors.gray[900],
    'bg-default': colors.gray[100],

    'text-error': colors.red[600],
    'bg-error': colors.red[200],

    'text-warning': colors.orange[800],
    'bg-warning': colors.yellow[200],

    'text-info': colors.teal[800],
    'bg-info': colors.green[200],

    'text-toolbar': colors.teal[100],
    'bg-toolbar': '#2d6987',

    'text-drawer': colors.teal[900],
    'bg-drawer': '#c7e3f1',

    'text-primary': colors.blue[200],
    'bg-primary': colors.blue[600],

    'text-secondary': colors.pink[200],
    'bg-secondary': colors.pink[600],

    'text-tertiary': colors.purple[200],
    'bg-tertiary': colors.purple[600],

    'text-contrast': colors.red[300],
    'bg-contrast': colors.orange[600],

    'border-default': colors.gray[400],
    'border-highlight': colors.black,

    'bg-menu': colors.blue[100],
    'bg-menu-focused': colors.blue[200],
    'bg-menu-selected': colors.blue[300],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
