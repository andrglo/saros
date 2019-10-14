import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {getRecentActivity} from '../selectors/docs'
import t from '../lib/translate'

import RecentActivityList from './RecentActivityList'

// eslint-disable-next-line no-unused-vars
const log = debug('recentActivity:panel')

const RecentActivityPanel = props => {
  const {className, recentActivity} = props
  // log('render', props)
  return (
    <div className={cn('', className)}>
      <p className="pb-2 px-1 text-xl italic font-semibold tracking-wider">
        {t`Recent activity`}
      </p>
      <RecentActivityList recentActivity={recentActivity} />
    </div>
  )
}

RecentActivityPanel.propTypes = {
  className: PropTypes.string,
  recentActivity: PropTypes.array.isRequired
}

export default connect(state => {
  const recentActivity = getRecentActivity(state)
  return {
    recentActivity
  }
})(RecentActivityPanel)
