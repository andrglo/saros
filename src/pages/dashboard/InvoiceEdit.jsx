import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import {getDb} from '../../selectors/app'

// eslint-disable-next-line no-unused-vars
const log = debug('invoice:edit')

const InvoiceEdit = props => {
  const {className, query, db} = props
  log('render', props)
  const {id} = query
  // const formName = `invoiceEdit@${db}#${id}`
  return (
    <div className={cn('text-center text-xl italic pt-2', className)}>
      <p>InvoiceEdit (todo)</p>
    </div>
  )
}

InvoiceEdit.propTypes = {
  className: PropTypes.string,
  db: PropTypes.string.isRequired,
  query: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
}

export default connect(state => {
  const db = getDb(state)
  return {
    db
  }
})(InvoiceEdit)
