import React from 'react'
import ReactDOM from 'react-dom'

// Check browser compatibility
let browserIsOk
try {
  const a = {a: 'compatible!'}
  const f = () => {
    const b = {...a}
    console.log(`Browser is ${b.a}`)
  }
  f()
  browserIsOk = true
} catch (err) {
  const message = 'Sorry, browser is not supported!' // todo improve message and give instructions
  ReactDOM.render(
    React.createElement(
      'h1',
      {
        style: {
          color: 'red',
          margin: '1em'
        }
      },
      message
    ),
    document.getElementById('saros')
  )
}

if (browserIsOk) {
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
  if (
    process.env.NODE_ENV === 'production' &&
    'serviceWorker' in navigator
  ) {
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
    if (process.env.NODE_ENV === 'development') {
      require('./assets/translations.json') // to trigger rebuild
    }
  }
}
