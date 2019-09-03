import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import {LaunchIcon} from './assets/icons'
import t from './lib/translate'
import {pushBrowserLocation} from './actions/app'
import Version from './components/Version'

const log = debug('presentation')

const gradient = {
  background: 'linear-gradient(90deg, #38A169 0%, #C6F6D5 100%)'
}

const presentationClass = 'presentation'

// Inspired by https://www.tailwindtoolbox.com/templates/landing-page
const Presentation = props => {
  log('render', props)
  const {dispatch} = props

  useEffect(() => {
    document.documentElement.classList.add(presentationClass)
    return () => {
      document.documentElement.classList.remove(presentationClass)
    }
  }, [])

  return (
    <React.Fragment>
      <div className="pt-2" style={gradient}>
        <div className="container px-3 mx-auto flex flex-wrap flex-col md:flex-row items-center">
          <div className="flex flex-col w-full md:w-2/5 justify-center items-start text-center md:text-left">
            <p className="uppercase tracking-loose w-full">
              {t`This is a work in progress!`}
            </p>
            <h1 className="my-4 text-5xl font-bold leading-tight w-full">
              Saros
            </h1>
            <p className="leading-normal text-lg mb-4">
              {t`Saros is a side project of mine which aims to provide a cloud based full budgeting web app`}
            </p>
            <a
              className="hover:underline leading-normal text-2xl mb-8 mx-auto pl-1 flex md:mx-0"
              href="https://github.com/andrglo/saros"
            >
              {t`Learn more`}
              <LaunchIcon className="m-2" />
            </a>
            <button
              className="mx-auto flex lg:mx-0 hover:underline bg-white text-gray-800 font-bold rounded-full py-4 px-8 shadow-lg"
              type="button"
              onClick={() => {
                dispatch(pushBrowserLocation({pathname: '/signin'}))
              }}
            >
              {t`Sign in`}
            </button>
          </div>
          <div className="w-full md:w-3/5 py-6 text-center">
            <img
              className="w-full z-50 h-40 sm:h-48"
              src={require('./assets/dispersarpago.svg')}
              alt="todo"
            />
          </div>
        </div>
      </div>
      <div className="relative" style={gradient}>
        <img src={require('./assets/wave.svg')} alt="wave" />
      </div>
      <Version className="text-gray-600" />
    </React.Fragment>
  )
}

Presentation.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect()(Presentation)
