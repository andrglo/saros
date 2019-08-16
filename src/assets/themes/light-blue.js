const colors = require('../colors')

module.exports = {
  name: 'theme light blue', // t`theme light blue`
  colors: {
    'text-default': colors.black,
    'bg-default': colors.blue[100],

    'text-input': colors.blue[900],
    'bg-input': colors.blue[100],
    'bg-input-focused': colors.blue[300],

    'text-error': colors.red[900],
    'bg-error': colors.red[100],

    'text-warning': colors.orange[900],
    'bg-warning': colors.orange[400],

    'text-placeholder': colors.gray[600],

    'text-toolbar': colors.blue[900],
    'bg-toolbar': colors.blue[100],

    'text-drawer': colors.blue[900],
    'bg-drawer': colors.blue[200],

    'border-default': colors.blue[300],
    'border-focused': colors.blue[700],

    'text-menu': colors.blue[900],
    'bg-menu': colors.blue[200],
    'bg-menu-focused': colors.blue[400],
    'bg-menu-selected': colors.blue[400],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
