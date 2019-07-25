import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from './lib/translate'
import {pushBrowserLocation} from './actions/app'

const log = debug('presentation')

const Presentation = props => {
  log('render', props)
  const {dispatch} = props
  return (
    <div>
      Presentation
      <button
        className="bg-secondary hover:bg-teal-500 ml-2 text-primary font-bold py-2 px-4 rounded-full"
        type="button"
        onClick={() =>
          dispatch(pushBrowserLocation({pathname: '/signin'}))
        }
      >
        {t`Signin`}
      </button>
    </div>
  )
}

Presentation.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect()(Presentation)
