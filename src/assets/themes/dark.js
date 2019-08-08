const colors = require('../colors')

module.exports = {
  name: 'Dark',
  colors: {
    'text-default': colors.gray[100],
    'bg-default': colors.gray[900],

    'text-input': colors.gray[200],
    'bg-input': colors.gray[900],
    'bg-input-highlight': colors.gray[700],

    'text-error': colors.red[100],
    'bg-error': colors.red[900],

    'text-placeholder': colors.gray[700],

    'text-toolbar': colors.gray[200],
    'bg-toolbar': colors.gray[900],

    'text-drawer': colors.gray[200],
    'bg-drawer': colors.gray[800],

    'border-default': colors.gray[700],
    'border-highlight': colors.gray[500],

    'text-menu': colors.gray[200],
    'bg-menu': colors.gray[800],
    'bg-menu-highlight': colors.gray[700],
    'bg-menu-selected': colors.blue[600],

    income: colors.blue[400],
    expense: colors.red[400]
  }
}
