const colors = require('../colors')

module.exports = {
  name: 'theme light teal', // t`theme light teal`
  colors: {
    'text-default': colors.black,
    'bg-default': colors.teal[100],

    'text-input': colors.teal[900],
    'bg-input': colors.teal[100],
    'bg-input-focused': colors.teal[300],

    'text-error': colors.red[900],
    'bg-error': colors.red[100],

    'text-warning': colors.orange[900],
    'bg-warning': colors.orange[400],

    'text-placeholder': colors.gray[600],

    'text-toolbar': colors.teal[900],
    'bg-toolbar': colors.teal[100],

    'text-drawer': colors.teal[900],
    'bg-drawer': colors.teal[200],

    'border-default': colors.teal[300],
    'border-focused': colors.teal[700],

    'text-menu': colors.teal[900],
    'bg-menu': colors.teal[200],
    'bg-menu-focused': colors.teal[400],
    'bg-menu-selected': colors.blue[400],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
