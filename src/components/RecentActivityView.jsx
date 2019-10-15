import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import ExpandableRow from './ExpandableRow'
import {getElapsedTimeDescription} from '../lib/date'
import {
  getCategories,
  getAccounts,
  getDescriptionFromPartitions,
  concatDescription,
  getName,
  getPlaces,
  CREATED,
  DELETED
} from '../selectors/docs'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('recentActivity:view')

const getTransferDescription = (transfer, accounts) => {
  if (transfer.counterpart) {
    return (
      t`Transfer` +
      ' ' +
      (transfer.amount < 0 ? t`from` : t`to`) +
      ' ' +
      t`account` +
      ' "' +
      accounts[transfer.account].name +
      '" ' +
      (transfer.amount < 0 ? t`to` : t`from`) +
      ' "' +
      accounts[transfer.counterpart].name +
      '"'
    )
  }
  return (
    t`Adjustment` +
    ' ' +
    t`in` +
    ' ' +
    t`account` +
    ` "${accounts[transfer.account].name}"`
  )
}

const RecentActivityView = props => {
  const {
    className,
    recentActivity,
    accounts,
    categories,
    places
  } = props
  const {collection, doc, type, time} = recentActivity
  const [isOpen, setIsOpen] = useState()
  // log('render', props)
  let description
  let badge
  if (collection === 'invoices') {
    if (type === CREATED) {
      badge = t`New`
    } else if (type === DELETED) {
      badge = t`Deleted`
    }
    description = concatDescription(description, doc.notes)
    if (doc.partitions) {
      description = concatDescription(
        description,
        getDescriptionFromPartitions(doc.partitions, categories)
      )
    }
    if (doc.place) {
      description = concatDescription(
        description,
        getName(doc.place, places),
        ' ▪ '
      )
    }
  } else {
    description = getTransferDescription(doc, accounts)
  }
  return (
    <ExpandableRow
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={className}
    >
      <div className="flex">
        <p
          className={cn(
            'flex-1',
            {
              truncate: !isOpen
            },
            className
          )}
        >
          {description}
        </p>
        {badge && (
          <span
            className={cn(
              'ml-1 my-auto italic text-xs font-thin rounded-sm px-1',
              {
                'bg-highlight': type === CREATED,
                'bg-orange-400': type === DELETED
              },
              className
            )}
          >
            {badge}
          </span>
        )}
        <p className={cn('my-auto ml-1')}>
          {getElapsedTimeDescription(time)}
        </p>
      </div>
    </ExpandableRow>
  )
}

RecentActivityView.propTypes = {
  className: PropTypes.string,
  recentActivity: PropTypes.object.isRequired,
  places: PropTypes.object,
  categories: PropTypes.object,
  accounts: PropTypes.object
}

export default connect(state => {
  return {
    categories: getCategories(state),
    accounts: getAccounts(state),
    places: getPlaces(state)
  }
})(RecentActivityView)
