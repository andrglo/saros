const range = require('lodash/range')

module.exports = utils => {
  const {theme, addUtilities} = utils
  const {
    sizes = range(1, 5),
    colors = ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.6)'],
    speed = '1s',
    variants = ['responsive']
  } = theme('spinner', {})
  addUtilities({
    '@keyframes spinner': {
      to: {transform: 'rotate(360deg)'}
    }
  })
  const spinners = [
    ...sizes.map(size => ({
      [`.spinner-${size}`]: {
        '&::before': {
          content: "''",
          boxSizing: 'border-box',
          position: 'absolute',
          width: `${size}em`,
          height: `${size}em`,
          borderRadius: '50%',
          border: `calc(${size}em / 8) solid ${colors[0]}`,
          borderTopColor: colors[1],
          animation: `spinner ${speed} linear infinite`
        }
      }
    }))
  ]
  addUtilities(spinners, variants)
}
