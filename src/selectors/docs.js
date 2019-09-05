import {
  createSelector,
  createStructuredSelector,
  defaultMemoize as memoize
} from 'reselect'
import sumBy from 'lodash/sumBy'
import round from 'lodash/round'
import {
  subscribeCollection,
  convertRecordTimestamps
} from '../controller'
import {getDb} from './app'
import {
  toYearMonth,
  addMonths,
  extractYearMonth,
  today
} from '../lib/date'

const MONTH_SPAN_TO_BE_CACHED = 3

export const getCollection = (state, options) => {
  const {collection, ...rest} = options
  subscribeCollection(collection, rest)
  return (state.docs[collection] || {}).data
}

export const getDoc = (state, options) => {
  const {id} = options
  const data = getCollection(state, options)
  return data && id ? data[id] : data
}

// const transformDataToOptions = (data, labelKey) => {
//   const options = []
//   for (const key of Object.keys(data || {})) {
//     const doc = data[key]
//     options.push({
//       label: doc[labelKey],
//       value: key,
//       doc
//     })
//   }
//   return options
// }

const getMonthSpan = memoize((from, to) => {
  to = toYearMonth(to)
  from = from
    ? toYearMonth(from)
    : addMonths(to, -(MONTH_SPAN_TO_BE_CACHED - 1))
  const monthSpan = ['*']
  while (from <= to) {
    monthSpan.push(extractYearMonth(from))
    from = addMonths(from, 1)
  }
  return monthSpan
})

const invoiceTransform = (data, id, doc) => {
  if (doc.invoices) {
    doc.invoices = doc.invoices.map(item => {
      const {id, doc, ...rest} = item
      if (id && doc) {
        convertRecordTimestamps(doc)
        data[id] = doc
      }
      return {id, ...rest}
    })
  }
  data[id] = doc
}

export const getInvoices = (state, {from, to} = {}) =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/invoices`,
    transform: invoiceTransform,
    monthSpan: getMonthSpan(from, to)
  })

export const getBudgets = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/budgets`
  })

export const getTransfers = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/transfers`
  })

export const getAccounts = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/accounts`
  })

export const getCategories = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/categories`
  })

export const getCostCenters = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/costCenters`
  })

export const getPlaces = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/places`
  })

export const getAllCollections = createStructuredSelector({
  invoices: getInvoices,
  budgets: getBudgets,
  transfers: getTransfers,
  accounts: getAccounts,
  categories: getCategories,
  costCenters: getCostCenters,
  places: getPlaces
})

export const areAllCollectionsReady = allCollections => {
  for (const collection of Object.keys(allCollections || {})) {
    if (!allCollections[collection]) {
      return false
    }
  }
  return true
}

export const redistributeAmount = (partitions, newAmount) => {
  const total = round(sumBy(partitions, 'amount'), 2)
  const k = newAmount / total
  let remainder = newAmount
  const result = []
  for (const partition of partitions) {
    const partial = round(k * partition.amount, 2)
    remainder = round(remainder - partial, 2)
    result.push({
      ...partition,
      amount: partial
    })
  }
  if (!Math.isZero(remainder)) {
    const lastIndex = result.length - 1
    result[lastIndex].amount = round(
      result[lastIndex].amount + remainder,
      2
    )
  }
  return result
}

const getIdAndParcelIndex = id => {
  let [invoiceId, parcelIndex] = id.split('/')
  if (parcelIndex) {
    parcelIndex = Number(parcelIndex) - 1
  }
  return [invoiceId, parcelIndex]
}

export const getPartitions = (id, invoices, amount) => {
  const [invoiceId, parcelIndex] = getIdAndParcelIndex(id)
  const doc = invoices[invoiceId]
  const invoicePartitions =
    (typeof parcelIndex === 'number' &&
      doc.parcels[parcelIndex].partitions) ||
    doc.partitions
  if (invoicePartitions) {
    return redistributeAmount(invoicePartitions, amount)
  }
  let partitions = []
  for (const billedInvoice of doc.billedFrom) {
    const {id, amount, ...rest} = billedInvoice
    if (id) {
      partitions = [
        ...partitions,
        ...getPartitions(id, invoices, amount, partitions)
      ]
    } else {
      partitions.push({
        amount,
        ...rest
      })
    }
  }
  return partitions
}

export const expandInvoice = (id, invoices) => {
  const transactions = []
  const {parcels, billedFrom, ...invoice} = invoices[id]
  for (const [parcelIndex, parcel] of parcels.entries()) {
    let partitions = parcel.partitions || invoice.partitions
    if (!partitions) {
      partitions = getPartitions(id, invoices)
    }
    transactions.push({
      ...invoice,
      ...parcel,
      id: `${id}/${parcelIndex + 1}`,
      partitions: redistributeAmount(
        partitions,
        parcel.paidAmount || parcel.amount
      )
    })
  }
  return transactions
}

export const getTransactionsByDay = createSelector(
  createStructuredSelector({
    allCollections: getAllCollections,
    from: (state, {from} = {}) => from || today(),
    to: (state, {to} = {}) => to
  }),
  params => {
    let {allCollections, from, to} = params
    const transactions = {}
    if (!areAllCollectionsReady(allCollections)) {
      return[]// transactions
    }
    to = to && to >= from ? to : from
    // const {
    //   invoices,
    //   budgets,
    //   transfers,
    //   accounts,
    //   categories,
    //   costCenters,
    //   places
    // } = allCollections
    // for (const id of Object.keys(invoices)) {
    //   const parcels = expandInvoice(id, invoices)
    // }
    return []//transactions
  }
)
