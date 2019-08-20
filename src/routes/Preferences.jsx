import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import SmartInput from '../components/SmartInput'
import {getTheme, getLocale} from '../selectors/app'
import {setTheme} from '../reducers/app'
import {locales} from '../../saros.config'
import themes from '../loaders/themes!'
import {updateLocale} from '../actions/app'

const log = debug('preferences')

const Preferences = props => {
  log('render', props)
  const {dispatch, theme, locale} = props

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex">
        <SmartInput
          className="mx-1 w-1/2"
          label={t`Theme`}
          options={useMemo(
            () =>
              themes.map(theme => ({
                ...theme,
                label: t(theme.label)
              })),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [locale]
          )}
          value={theme}
          showfirstOptionAsDefault
          onChange={theme => {
            dispatch(setTheme({theme}))
          }}
        />
        <SmartInput
          className="mx-1 w-1/2"
          label={t`Language`}
          options={locales}
          value={locale}
          showfirstOptionAsDefault
          onChange={locale => {
            dispatch(updateLocale({locale}))
          }}
        />
      </div>
    </div>
  )
}

Preferences.propTypes = {
  dispatch: PropTypes.func.isRequired,
  theme: PropTypes.string,
  locale: PropTypes.string
}

export default connect(state => {
  const theme = getTheme(state)
  const locale = getLocale(state)
  return {
    theme,
    locale
  }
})(Preferences)
