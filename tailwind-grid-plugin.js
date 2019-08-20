const range = require('lodash/range')

module.exports = utils => {
  const {theme, addUtilities} = utils
  const {
    grids = range(1, 13),
    gaps = [0, 1, 2, 3, 4],
    variants = ['responsive']
  } = theme('grid', {})
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
    })),
    ...grids.map(columns => ({
      [`.gy-span-${columns}`]: {
        gridColumn: `span ${columns}`
      }
    })),
    {
      '.gy-full': {
        gridColumn: `1 / -1`
      }
    },
    ...gaps.map(gap => ({
      [`.grid-gap-${gap}`]: {
        gridGap: `${gap / 4}em`
      }
    }))
  ]
  addUtilities(utilities, variants)
}
