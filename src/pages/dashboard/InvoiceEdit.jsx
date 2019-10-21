import React from 'react'
import {hot} from 'react-hot-loader/root'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import Form from '../../components/Form'

import t from '../../lib/translate'
import {makeFormName} from '../../selectors/forms'
import {
  getCollectionFullName,
  getInvoices
} from '../../selectors/docs'
import FormButtons from '../../components/FormButtons'
import SmartInput from '../../components/SmartInput'

const form = 'invoice:edit'

// eslint-disable-next-line no-unused-vars
const log = debug(form)

const InvoiceEdit = props => {
  const {className, query, collection} = props
  log('render', props)
  const {id, isNew} = query
  const formName = makeFormName(form, collection, id)
  const title = t`Transaction`
  // toBeContinued...
  return (
    <React.Fragment>
      <p className="title">{title}</p>
      <Form
        className={cn(
          'mx-auto max-w-xl grid grid-gap-1 pt-4 p-1 grid-columns-1 sm:grid-columns-3 lg:grid-columns-4',
          className
        )}
        formName={formName}
        title={title}
        collection={collection}
        selector={getInvoices}
        id={id}
        isNew={isNew === 'true'}
      >
        <SmartInput id="notes" />
        <FormButtons className="" />
      </Form>
    </React.Fragment>
  )
}

InvoiceEdit.propTypes = {
  className: PropTypes.string,
  collection: PropTypes.string.isRequired,
  query: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isNew: PropTypes.string
  }).isRequired
}

export default hot(
  connect(state => {
    const collection = getCollectionFullName(state, 'invoices')
    return {
      collection
    }
  })(InvoiceEdit)
)
