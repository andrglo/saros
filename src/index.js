import React from 'react'
import ReactDOM from 'react-dom'

// Check browser compatibility
// If has service worker => support async and object spread
if (!('serviceWorker' in navigator)) {
  const message = 'Sorry, browser is not supported!' // todo improve message and give instructions
  ReactDOM.render(
    React.createElement('h1', {}, message),
    document.getElementById('saros')
  )
} else {
  const boot = async () => {
    const {createStore} = await import('./controller')
    const store = await createStore()
    const {default: App} = await import('./App')
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
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(sw => {
          window.sarosSW = sw
          console.log('SW registered: ', sw)
          boot()
        })
        .catch(err => {
          console.error('SW registration failed: ', err)
        })
    })
  } else {
    boot()
    if (module.hot) {
      module.hot.accept()
    }
  }
}
