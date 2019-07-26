import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import {MdLaunch} from 'react-icons/md'

import t from './lib/translate'
import {pushBrowserLocation} from './actions/app'

const log = debug('presentation')

const gradient = {
  background: 'linear-gradient(90deg, #38A169 0%, #C6F6D5 100%)'
}

// Inspired by https://www.tailwindtoolbox.com/templates/landing-page
const Presentation = props => {
  log('render', props)
  const {dispatch} = props
  return (
    <React.Fragment>
      <div className="pt-2" style={gradient}>
        <div className="container px-3 mx-auto flex flex-wrap flex-col md:flex-row items-center">
          <div className="flex flex-col w-full md:w-2/5 justify-center items-start text-center md:text-left">
            <p className="uppercase tracking-loose w-full">
              {t`This is a work in progress!`}
            </p>
            <h1 className="my-4 text-5xl font-bold leading-tight">
              {t`Saros`}
            </h1>
            <p className="leading-normal text-2xl mb-4">
              {t`Saros is a side project of mine which aims to provide a cloud based full budgeting web app`}
            </p>
            <a
              className="hover:underline leading-normal text-2xl mb-8 flex justify-center md:justify-start w-full"
              href="https://github.com/andrglo/saros"
            >
              {t`Learn more`}
              <MdLaunch className="m-2" />
            </a>
            <button
              className="mx-auto flex lg:mx-0 hover:underline bg-white text-gray-800 font-bold rounded-full my-6 py-4 px-8 shadow-lg"
              type="button"
              onClick={() =>
                dispatch(pushBrowserLocation({pathname: '/signin'}))
              }
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
    </React.Fragment>
  )
}

Presentation.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect()(Presentation)
