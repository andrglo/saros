import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import t from '../lib/translate'

const ButtonsPanel = props => {
  const {dispatch, className, ...rest} = props
  return (
    <div className="w-full flex">
      <button className="btn btn-tertiary" type="button">{t`Delete`}</button>
      <span className="flex-1" />
      <button className="btn btn-secondary mr-1" type="reset">{t`Restore`}</button>
      <button className="btn btn-default" type="submit">{t`Save`}</button>
    </div>
  )
}

ButtonsPanel.propTypes = {
  dispatch: PropTypes.func.isRequired,
  className: PropTypes.string
}

export default connect()(ButtonsPanel)
