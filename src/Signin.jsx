import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import './index.css'
import {getTheme} from './selectors/app'
import {setTheme} from './reducers/app'
import t from './lib/translate'
import {updateLocale} from './actions/app'

let locale

const Signin = props => {
  const {dispatch, theme} = props
  console.log('Signin', props)
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
        {t`Change theme`}
      </button>
      <button
        className="bg-secondary hover:bg-teal-500 ml-2 text-primary font-bold py-2 px-4 rounded-full"
        type="button"
        onClick={() => {
          const nextLocale = locale === 'en' ? 'pt-BR' : 'en'
          dispatch(updateLocale({locale: nextLocale}))
          locale = nextLocale
        }}
      >
        {t`Change locale` + t` Hi ${1} times`}
      </button>
    </div>
  )
}

Signin.propTypes = {
  dispatch: PropTypes.func.isRequired,
  theme: PropTypes.string
  // locale: PropTypes.string
}

export default connect(state => {
  return {
    theme: getTheme(state)
    // locale: getLocale(state)
  }
})(Signin)
