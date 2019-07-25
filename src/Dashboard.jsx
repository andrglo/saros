import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {disconnect} from './controller'
import t from './lib/translate'

const Dashboard = props => {
  const {dispatch} = props
  return (
    <div className="text-red-600">
      Dashboard
      <button
        className="bg-secondary hover:bg-teal-500 ml-2 text-primary font-bold py-2 px-4 rounded-full"
        type="button"
        onClick={disconnect}
      >
        {t`Out`}
      </button>
    </div>
  )
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect()(Dashboard)
