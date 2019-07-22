module.exports = {
  theme: {
    spinner: theme => ({
      default: {
        color: theme('colors.blue.500', 'red'), // color you want to make the spinner
        size: '3em', // size of the spinner (used for both width and height)
        border: '5px', // border-width of the spinner (shouldn't be bigger than half the spinner's size)
        speed: '1000ms' // the speed at which the spinner should rotate
      }
    }),
    extend: {}
  },
  variants: {
    spinner: ['responsive']
  },
  plugins: [require('tailwindcss-spinner')()]
}
