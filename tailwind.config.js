module.exports = {
  theme: {
    extend: {
      textColor: {
        default: 'var(--color-text-default)',
        error: 'var(--color-text-error)',
        warning: 'var(--color-text-warning)',
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
        warning: 'var(--color-bg-warning)',
        input: 'var(--color-bg-input)',
        'focused-input': 'var(--color-bg-input-focused)',
        toolbar: 'var(--color-bg-toolbar)',
        drawer: 'var(--color-bg-drawer)',
        menu: 'var(--color-bg-menu)',
        'menu-focused': 'var(--color-bg-menu-focused)',
        'menu-selected': 'var(--color-bg-menu-selected)'
      },
      placeholderColor: () => ({
        input: 'var(--color-text-placeholder)'
      }),
      borderColor: () => ({
        default: 'var(--color-border-default)',
        focused: 'var(--color-border-focused)',
        menu: 'var(--color-text-menu)',
        divider: 'var(--color-divider)'
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
