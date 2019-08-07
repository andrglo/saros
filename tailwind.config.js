module.exports = {
  theme: {
    extend: {
      textColor: {
        default: 'var(--color-text-default)',
        error: 'var(--color-text-error)',
        input: 'var(--color-text-input)',
        toolbar: 'var(--color-text-toolbar)',
        drawer: 'var(--color-text-drawer)',
        menu: 'var(--color-text-menu)',
        income: 'var(--color-income)',
        expense: 'var(--color-expense)'
      },
      backgroundColor: {
        default: 'var(--color-bg-default)',
        error: 'var(--color-bg-error)',
        input: 'var(--color-bg-input)',
        'highlight-input': 'var(--color-bg-input-highlight)',
        toolbar: 'var(--color-bg-toolbar)',
        drawer: 'var(--color-bg-drawer)',
        menu: 'var(--color-bg-menu)',
        'menu-highlight': 'var(--color-bg-menu-highlight)',
        'menu-selected': 'var(--color-bg-menu-selected)'
      },
      placeholderColor: () => ({
        input: 'var(--color-text-placeholder)'
      }),
      borderColor: () => ({
        default: 'var(--color-border-default)',
        highlight: 'var(--color-border-highlight)',
        menu: 'var(--color-text-menu)'
      }),
      fontWeight: {
        budget: 100,
        due: 700,
        overdue: 900
      }
    },
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
    spinner: ['responsive'],
    borderWidth: ['responsive', 'hover']
  },
  plugins: [require('tailwindcss-spinner')()]
}
