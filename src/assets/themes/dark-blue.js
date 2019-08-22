const colors = require('../colors')

module.exports = {
  name: 'theme dark blue', // t`theme dark blue`
  colors: {
    'text-default': colors.blue[100],
    'bg-default': colors.blue[900],

    'text-input': colors.blue[200],
    'bg-input': colors.blue[900],
    'bg-input-focused': colors.blue[700],

    'text-error': colors.red[100],
    'bg-error': colors.red[900],

    'text-warning': colors.orange[400],
    'bg-warning': colors.orange[900],

    'text-info': colors.blue[100],
    'bg-info': colors.blue[700],

    'text-primary': colors.white,
    'bg-primary': colors.blue[600],

    'text-placeholder': colors.gray[700],

    'text-toolbar': colors.blue[200],
    'bg-toolbar': colors.blue[900],

    'text-drawer': colors.blue[200],
    'bg-drawer': colors.blue[800],

    'border-default': colors.blue[700],
    'border-focused': colors.blue[500],

    divider: 'rgba(255,255,255,.1)',

    'text-menu': colors.blue[200],
    'bg-menu': colors.blue[800],
    'bg-menu-focused': colors.blue[700],
    'bg-menu-selected': colors.blue[600],

    income: colors.blue[400],
    expense: colors.red[400]
  }
}
