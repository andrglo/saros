import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import debug from 'debug'

import RecentActivityView from './RecentActivityView'

// eslint-disable-next-line no-unused-vars
const log = debug('recentActivity:list')

const RecentActivityList = props => {
  const {recentActivity, className} = props
  // log('render', props)
  return (
    <ol className={cn('px-1', className)}>
      {recentActivity.map(recentActivity => {
        return (
          <li
            key={
              recentActivity.id +
              recentActivity.method +
              recentActivity.at
            }
            className=""
          >
            <RecentActivityView recentActivity={recentActivity} />
          </li>
        )
      })}
    </ol>
  )
}

RecentActivityList.propTypes = {
  className: PropTypes.string,
  recentActivity: PropTypes.arrayOf(PropTypes.object.isRequired)
}

export default RecentActivityList
