const {lighten} = require('polished')

module.exports = utils => {
  const {theme, addComponents} = utils
  const baseColors = ['default', 'primary', 'secondary', 'tertiary']
  const {colors = []} = theme('buttons', {})
  const buttons = {
    '.btn': {
      padding: '.5rem 1rem',
      borderRadius: '.25rem',
      borderWidth: 1,
      fontWeight: '500',
      textTransform: 'uppercase',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)'
      }
    }
  }
  for (const color of [...baseColors, ...colors]) {
    buttons[`.btn-${color}`] = {
      backgroundColor: `var(--color-bg-${color})`,
      color: `var(--color-text-${color})`,
      '&:hover': {
        backgroundColor: `var(--color-bg-${color}-hover)`,
        color: `var(--color-text-${color}-hover)`,
      },
      '&:active': {
        backgroundColor: `var(--color-bg-${color}-active)`,
        color: `var(--color-text-${color}-active)`,
      }
    }
  }
  addComponents(buttons)
}
