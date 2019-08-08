const colors = require('../colors')

module.exports = {
  name: 'Light blue',
  colors: {
    'text-default': colors.black,
    'bg-default': colors.blue[100],

    'text-input': colors.blue[900],
    'bg-input': colors.blue[100],
    'bg-input-highlight': colors.blue[200],

    'text-error': colors.red[900],
    'bg-error': colors.red[100],

    'text-placeholder': colors.gray[600],

    'text-toolbar': colors.blue[900],
    'bg-toolbar': colors.blue[100],

    'text-drawer': colors.blue[900],
    'bg-drawer': colors.blue[200],

    'border-default': colors.blue[300],
    'border-highlight': colors.blue[700],

    'text-menu': colors.blue[900],
    'bg-menu': colors.blue[200],
    'bg-menu-highlight': colors.blue[400],
    'bg-menu-selected': colors.blue[400],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
