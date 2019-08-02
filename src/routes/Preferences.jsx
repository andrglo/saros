import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import Input from '../components/Input'
import {getTheme} from '../selectors/app'
import {setTheme} from '../reducers/app'

const log = debug('preferences')

const Preferences = props => {
  log('render', props)
  const {dispatch, theme} = props

  return (
    <div className="flex">
      <Input
        className="mx-1"
        label={t`Theme`}
        options="Light,Dark"
        value={theme}
        placeholder="For now type dark"
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
