import React from 'react'
import {hot} from 'react-hot-loader/root'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {connect} from 'react-redux'
import debug from 'debug'

import Form from '../../components/Form'

import t from '../../lib/translate'
import {
  makeFormName,
  getForm,
  getFormValues
} from '../../selectors/forms'
import {
  getCollectionFullName,
  getInvoices,
  getInvoiceTotal
} from '../../selectors/docs'
import FormButtons from '../../components/FormButtons'
import SmartInput from '../../components/SmartInput'
import coalesce from '../../lib/coalesce'

// eslint-disable-next-line no-unused-vars
const log = debug('invoice:edit')

const InvoiceEdit = props => {
  const {className, query, collection, formName, totalAmount} = props
  log('render', props)
  const {id, isNew} = query
  const title = t`Transaction`
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
        <SmartInput
          id="issueDate"
          label={t`Issue date`}
          type="date"
        />
        <SmartInput
          id="totalAmount"
          label={t`Total amount`}
          type="currency"
          value={totalAmount}
        />
        <SmartInput label={t`Notes`} id="notes" />
        <FormButtons className="" />
      </Form>
    </React.Fragment>
  )
}

InvoiceEdit.propTypes = {
  className: PropTypes.string,
  collection: PropTypes.string.isRequired,
  formName: PropTypes.string.isRequired,
  totalAmount: PropTypes.number,
  query: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isNew: PropTypes.string
  }).isRequired
}

export default hot(
  connect((state, props) => {
    let {query, collection} = props
    const {id} = query
    collection = getCollectionFullName(state, 'invoices')
    const formName = makeFormName('InvoiceEdit', collection, id)
    const form = getForm(state, {formName})
    const values = getFormValues(form) || {}
    const totalAmount = coalesce(
      values.totalAmount,
      getInvoiceTotal(values)
    )
    return {
      collection,
      formName,
      totalAmount
    }
  })(InvoiceEdit)
)
