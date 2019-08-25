module.exports = {
  theme: {
    extend: {
      textColor: {
        default: 'var(--color-text-default)',
        error: 'var(--color-text-error)',
        warning: 'var(--color-text-warning)',
        info: 'var(--color-text-info)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        contrast: 'var(--color-text-contrast)',
        toolbar: 'var(--color-text-toolbar)',
        drawer: 'var(--color-text-drawer)',
        menu: 'var(--color-text-menu)',
        income: 'var(--color-income)',
        expense: 'var(--color-expense)'
      },
      backgroundColor: {
        default: 'var(--color-bg-default)',
        error: 'var(--color-bg-error)',
        warning: 'var(--color-bg-warning)',
        info: 'var(--color-bg-info)',
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        tertiary: 'var(--color-bg-tertiary)',
        contrast: 'var(--color-bg-contrast)',
        toolbar: 'var(--color-bg-toolbar)',
        drawer: 'var(--color-bg-drawer)',
        menu: 'var(--color-bg-menu)',
        'menu-focused': 'var(--color-bg-menu-focused)', // some cases outline do not work
        'menu-selected': 'var(--color-bg-menu-selected)',
        highlight: 'var(--color-highlight)'
      },
      borderColor: () => ({
        default: 'var(--color-border-default)',
        highlight: 'var(--color-border-highlight)'
      }),
      fontWeight: {
        budget: 100,
        due: 700,
        overdue: 900
      },
      maxHeight: {
        '(screen-12)': 'calc(100vh - 3rem)',
        '(screen-16)': 'calc(100vh - 4rem)'
      }
    }
  },
  variants: {
    spinner: ['responsive'],
    borderWidth: ['responsive', 'hover']
  },
  plugins: [
    require('./tailwind-grid-plugin'),
    require('./tailwind-spinner-plugin')
  ]
}
