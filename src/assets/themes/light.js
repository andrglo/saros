const colors = require('../colors')

module.exports = {
  name: 'Light',
  colors: {
    'text-default': colors.black,
    'bg-default': colors.gray[100],

    'text-input': colors.gray[900],
    'bg-input': colors.gray[100],
    'bg-input-highlight': colors.gray[200],

    'text-error': colors.red[900],
    'bg-error': colors.red[100],

    'text-placeholder': colors.gray[600],

    'text-toolbar': colors.gray[900],
    'bg-toolbar': colors.gray[100],

    'text-drawer': colors.gray[900],
    'bg-drawer': colors.gray[200],

    'border-default': colors.gray[300],
    'border-highlight': colors.gray[700],

    'text-menu': colors.gray[900],
    'bg-menu': colors.gray[200],
    'bg-menu-highlight': colors.gray[400],
    'bg-menu-selected': colors.blue[400],

    income: colors.blue[600],
    expense: colors.red[600]
  }
}
