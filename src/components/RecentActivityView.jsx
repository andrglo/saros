import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import ExpandableRow from './ExpandableRow'
import {getElapsedTimeDescription} from '../lib/date'

// eslint-disable-next-line no-unused-vars
const log = debug('recentActivity:view')

const RowView = props => {
  const {className, truncate = true, description, elapsed} = props
  return (
    <div className="flex">
      <p
        className={cn(
          'flex-1 pr-1',
          {
            truncate
          },
          className
        )}
      >
        {description}
      </p>
      <p className={cn('my-auto')}>{elapsed}</p>
    </div>
  )
}

RowView.propTypes = {
  className: PropTypes.string,
  description: PropTypes.string.isRequired,
  elapsed: PropTypes.string.isRequired,
  truncate: PropTypes.bool
}

const RecentActivityView = props => {
  const {className, recentActivity} = props
  const {doc, description} = recentActivity
  const [isOpen, setIsOpen] = useState()
  // log('RecentActivityView', props)
  return (
    <ExpandableRow
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={className}
    >
      <RowView
        description={description}
        elapsed={getElapsedTimeDescription(doc.updatedAt)}
        truncate={!isOpen}
      />
    </ExpandableRow>
  )
}

RecentActivityView.propTypes = {
  className: PropTypes.string,
  recentActivity: PropTypes.object.isRequired
}

export default connect()(RecentActivityView)
