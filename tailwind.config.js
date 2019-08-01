module.exports = {
  theme: {
    extend: {
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        default: 'var(--color-text-default)',
        contrast: 'var(--color-text-contrast)',
        menu: 'var(--color-text-menu)',
        income: 'var(--color-income)',
        expense: 'var(--color-expense)'
      },
      backgroundColor: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        default: 'var(--color-bg-default)',
        contrast: 'var(--color-bg-contrast)',
        menu: 'var(--color-bg-menu)',
        menuHover: 'var(--color-bg-hover-menu)',
        menuSelected: 'var(--color-bg-selected-menu)'
      },
      fontWeight: {
        budget: 100,
        due: 700,
        overdue: 900
      }
    },
    borderColor: theme => ({
      ...theme('colors'),
      default: 'var(--color-text-default)',
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      menu: 'var(--color-text-menu)'
    }),
    spinner: theme => ({
      default: {
        color: theme('colors.blue.500', 'red'), // color you want to make the spinner
        size: '3em', // size of the spinner (used for both width and height)
        border: '5px', // border-width of the spinner (shouldn't be bigger than half the spinner's size)
        speed: '1000ms' // the speed at which the spinner should rotate
      }
    })
  },
  variants: {
    spinner: ['responsive']
  },
  plugins: [require('tailwindcss-spinner')()]
}
