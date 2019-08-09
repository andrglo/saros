const colors = require('../colors')

module.exports = {
  name: 'Dark teal',
  colors: {
    'text-default': colors.teal[100],
    'bg-default': colors.teal[900],

    'text-input': colors.teal[200],
    'bg-input': colors.teal[900],
    'bg-input-highlight': colors.teal[600],

    'text-error': colors.red[100],
    'bg-error': colors.red[900],

    'text-placeholder': colors.teal[700],

    'text-toolbar': colors.teal[200],
    'bg-toolbar': colors.teal[900],

    'text-drawer': colors.teal[200],
    'bg-drawer': colors.teal[800],

    'border-default': colors.teal[700],
    'border-highlight': colors.teal[500],

    'text-menu': colors.teal[200],
    'bg-menu': colors.teal[800],
    'bg-menu-highlight': colors.teal[700],
    'bg-menu-selected': colors.blue[600],

    income: colors.blue[400],
    expense: colors.red[400]
  }
}
