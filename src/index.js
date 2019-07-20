import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'

import './index.css'
import {createStore} from './controller'
import App from './App'

createStore().then(store => {
  ReactDOM.render(
    React.createElement(
      Provider,
      {
        store
      },
      App
    ),
    document.getElementById('saros')
  )
})

if (module.hot) {
  module.hot.accept()
}
