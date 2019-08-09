import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import Input from '../components/Input'
import {getTheme} from '../selectors/app'
import {setTheme} from '../reducers/app'
import themes from '../loaders/themes!'

const log = debug('preferences')

const Preferences = props => {
  log('render', props)
  const {dispatch, theme} = props

  return (
    <div className="flex">
      <Input
        className="mx-1 w-1/2"
        label={t`Theme`}
        value={theme}
        placeholder="Type the value here"
        onChange={theme => {
          dispatch(setTheme({theme}))
        }}
      />
      <Input
        className="mx-1 w-1/2"
        label={t`Theme`}
        options={themes}
        value={theme}
        placeholder="Select one"
        onChange={theme => {
          dispatch(setTheme({theme}))
        }}
      />
    </div>
  )
}

Preferences.propTypes = {
  dispatch: PropTypes.func.isRequired,
  theme: PropTypes.string
}

export default connect(state => {
  const theme = getTheme(state)
  return {
    theme
  }
})(Preferences)
