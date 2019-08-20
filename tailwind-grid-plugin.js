const range = require('lodash/range')

module.exports = utils => {
  const {theme, addUtilities} = utils
  const {grids = range(1, 13), variants = ['responsive']} = theme(
    'grid',
    {}
  )
  const utilities = [
    {
      '.grid': {
        display: 'grid'
      }
    },
    ...grids.map(columns => ({
      [`.grid-columns-${columns}`]: {
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }
    }))
  ]
  addUtilities(utilities, variants)
}
