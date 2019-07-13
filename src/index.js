import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

ReactDOM.render(
  React.createElement(App),
  document.getElementById('saros')
)

if (module.hot) {
  module.hot.accept()
}
