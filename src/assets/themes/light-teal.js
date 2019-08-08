const colors = require('../colors')

module.exports = {
  name: 'Light teal',
  colors: {
    'text-default': colors.black,
    'bg-default': colors.teal[100],

    'text-input': colors.teal[900],
    'bg-input': colors.teal[100],
    'bg-input-highlight': colors.teal[200],

    'text-error': colors.red[900],
    'bg-error': colors.red[100],

    'text-placeholder': colors.gray[600],

    'text-toolbar': colors.teal[900],
    'bg-toolbar': colors.teal[100],

    'text-drawer': colors.teal[900],
    'bg-drawer': colors.teal[200],

    'border-default': colors.teal[300],
    'border-highlight': colors.teal[700],

    'text-menu': colors.teal[900],
    'bg-menu': colors.teal[200],
    'bg-menu-highlight': colors.teal[400],
    'bg-menu-selected': colors.blue[400],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
