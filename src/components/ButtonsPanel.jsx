import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import t from '../lib/translate'

const ButtonsPanel = props => {
  const {dispatch, className, ...rest} = props
  return (
    <div className="w-full flex">
      <button type="button">{t`Delete`}</button>
      <span className="flex-1" />
      <button type="reset">{t`Restore`}</button>
      <button type="submit">{t`Save`}</button>
    </div>
  )
}

ButtonsPanel.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string
}

export default connect()(ButtonsPanel)
