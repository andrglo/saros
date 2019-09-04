import {
  createSelector,
  createStructuredSelector,
  defaultMemoize as memoize
} from 'reselect'
import {
  subscribeCollection,
  convertRecordTimestamps
} from '../controller'
import {getDb} from './app'
import {toYearMonth} from '../lib/date'

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
    : to.plusMonths(-(MONTH_SPAN_TO_BE_CACHED - 1))
  const monthSpan = ['*']
  while (!from.isAfter(to)) {
    monthSpan.push(from.toString())
    from = from.plusMonths(1)
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

export const getTransactions = createSelector(
  createStructuredSelector({
    allCollections: getAllCollections
  }),
  params => {
    const {allCollections} = params
    const transactions = []
    if (!areAllCollectionsReady(allCollections)) {
      return transactions
    }
    // const {invoices, budgets, transfers, accounts, categories, costCenters, places} = allCollections
    return transactions
  }
)
