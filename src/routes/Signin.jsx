import React, {useState, useEffect} from 'react'
import debug from 'debug'
import cn from 'classnames'

import t from '../lib/translate'
import firebase from '../lib/firebase'
import {manifest} from '../../saros.config'
import isEmailValid from '../lib/isEmailValid'
import Link from '../components/Link'

const log = debug('signin')

const signinClass = 'signin'
const lastEmailUsedToLogin = 'lastEmailUsedToLogin'

const Signin = props => {
  log('render', props)

  useEffect(() => {
    document.documentElement.classList.add(signinClass)
    return () => {
      document.documentElement.classList.remove(signinClass)
    }
  }, [])

  const [email, setEmail] = useState(
    localStorage.getItem(lastEmailUsedToLogin) || ''
  )
  const [signingIn, setsigningIn] = useState()
  const [sent, setSent] = useState()
  const [error, setError] = useState()

  const signIn = () => {
    setsigningIn(true)
    setError(null)
    firebase
      .auth()
      .sendSignInLinkToEmail(email, {
        url: window.location.href,
        handleCodeInApp: true
      })
      .then(() => {
        localStorage.setItem(lastEmailUsedToLogin, email)
        setSent(true)
      })
      .catch(err => {
        setsigningIn(false)
        setError(err.message)
      })
  }
  const signInUsingGoogle = () => {
    setsigningIn(true)
    setError(null)
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase
      .auth()
      .signInWithPopup(provider)
      .catch(err => {
        setsigningIn(false)
        setError(err.message)
      })
  }

  const signInAnonymously = () => {
    setsigningIn(true)
    setError(null)
    firebase
      .auth()
      .signInAnonymously()
      .catch(err => {
        setsigningIn(false)
        setError(err.message)
      })
  }

  const linkSignInDisabled = signingIn || !isEmailValid(email)
  return (
    <div>
      <div className="relative flex items-center justify-center h-screen">
        <div className="bg-teal-300 text-white font-bold rounded-lg border shadow-lg m-2 p-10 pt-5">
          <p className="mb-3 mx-auto text-xl text-teal-800 text-center">
            {`${manifest.appName},  ${t`lets go budgeting`}`}
          </p>
          {error && (
            <p className="m-3 mx-auto max-w-xs text-red-600 text-center">
              {error}
            </p>
          )}
          {sent && (
            <p className="m-3 mx-auto max-w-xs text-orange-500 text-center">
              {t`email has been sent`}
            </p>
          )}
          <input
            className="bg-gray-100 mb-2 border-teal-900 border text-teal-800  rounded-sm h-8 w-full pl-2"
            type="email"
            autoFocus
            placeholder="Email"
            disabled={sent}
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
          <button
            className={cn(
              'mx-auto flex bg-teal-200 rounded-full mb-6 py-4 px-8 shadow-lg',
              {
                'cursor-default text-teal-400': linkSignInDisabled,
                'hover:underline text-teal-800': !linkSignInDisabled
              }
            )}
            type="button"
            disabled={linkSignInDisabled}
            onClick={signIn}
          >
            {t`signin link`}
          </button>
          <p className="m-4 mx-auto text-lg text-teal-800 text-center">
            {t`or`}
          </p>
          <button
            className="mx-auto flex hover:underline bg-teal-200 text-teal-800 rounded-full mb-6 py-4 px-8 shadow-lg"
            type="button"
            disabled={signingIn}
            onClick={signInUsingGoogle}
          >
            {t`signin google`}
            <img
              className="h-6 ml-4"
              src={require('../assets/google.svg')}
              alt="google logo"
            />
          </button>
          <button
            className="mx-auto flex hover:underline bg-teal-200 text-teal-800 rounded-full mb-0 py-4 px-8 shadow-lg"
            type="button"
            disabled={signingIn}
            onClick={signInAnonymously}
          >
            {t`signin anonymously`}
          </button>
          <div className="max-w-xs mx-auto">
            <p className="mt-6 mx-auto text-xs text-teal-800 text-center">
              {`${t`By using`} ${
                manifest.appShortName
              } ${t`you agree to our`} `}
              <Link className="italic" to="/privacy">
                {t`Privacy Policy`}
              </Link>
              {` ${t`and`} `}
              <Link className="italic" to="/agreement">
                {t`Terms of Service`}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signin
