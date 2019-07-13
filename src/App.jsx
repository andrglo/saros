import React from 'react'
import PropTypes from 'prop-types'

import './index.css'

const App = ({title}) => (
  <div className="text-red-600">{title || 'Hello World!'}</div>
)

App.propTypes = {
  title: PropTypes.string
}

export default App
