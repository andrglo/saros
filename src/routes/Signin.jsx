import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import firebase from '../lib/firebase'
import {pushBrowserLocation} from '../actions/app'

const log = debug('signin')

const Signin = connect()(props => {
  log('render', props)
  const {dispatch} = props
  const [signingIn, setsigningIn] = useState()
  // const [signinProvider, setSigninProvider] = useState()
  const [error, setError] = useState()

  const signInUsingGoogle = () => {
    setsigningIn(true)
    // setSigninProvider('google')
    setError(null)
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase
      .auth()
      .signInWithPopup(provider)
      .catch(err => {
        setsigningIn(false)
        // setSigninProvider(null)
        setError(err.message)
      })
  }

  return (
    <div>
      {error && <div className="bg-red-500">{error}</div>}
      SignIn
      <button
        className="bg-secondary hover:bg-teal-500 ml-2 text-primary font-bold py-2 px-4 rounded-full"
        type="button"
        disabled={signingIn}
        onClick={signInUsingGoogle}
      >
        {t`Enter`}
      </button>
    </div>
  )
})

Signin.propTypes = {
  setView: PropTypes.func
}

export default Signin
