const boot = async () => {
  const {createStore} = await import('./controller')
  const store = await createStore()
  const {default: App} = await import('./App')
  const {default: React} = await import('react')
  const {default: ReactDOM} = await import('react-dom')
  const {Provider} = await import('react-redux')
  ReactDOM.render(
    React.createElement(
      Provider,
      {
        store
      },
      React.createElement(App)
    ),
    document.getElementById('saros')
  )
}

boot()

if (module.hot) {
  module.hot.accept()
}
