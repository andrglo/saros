import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import './index.css'
import {getTheme} from './selectors/app'
import {setTheme} from './reducers/app'

const Signin = props => {
  const {dispatch, theme} = props
  return (
    <div className="text-primary font-normal bg-primary font-sans text-red-600">
      <button
        className="bg-secondary hover:bg-teal-700 ml-2 text-primary font-bold py-2 px-4 rounded-full"
        type="button"
        onClick={() =>
          dispatch(
            setTheme({theme: theme === 'dark' ? null : 'dark'})
          )
        }
      >
        Alterar tema
      </button>
    </div>
  )
}

Signin.propTypes = {
  dispatch: PropTypes.func.isRequired,
  theme: PropTypes.string
}

export default connect(state => {
  return {
    theme: getTheme(state)
  }
})(Signin)
