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
  today,
  getLengthOfMonth,
  setDayOfMonth,
  addDays,
  isBusinessDay
} from '../lib/date'
import {getHolidays, loadHolidays} from './atlas'

const MONTH_SPAN_TO_BE_CACHED = 3
const MONTHS_FOR_CREDITCARD_DUE_DATES = 6

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

const transformDataToOptions = labelKey => data => {
  const options = []
  for (const key of Object.keys(data || {})) {
    const doc = data[key]
    options.push({
      label: doc[labelKey],
      value: key,
      doc
    })
  }
  return options
}

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

export const getAccountsAsOptions = createSelector(
  getAccounts,
  transformDataToOptions('name')
)

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

export const getAccountsCities = createSelector(
  getAccounts,
  accounts => {
    const regions = []
    if (accounts) {
    }
    return regions
  }
)

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

export const getHolidaysForAccounts = createSelector(
  getHolidays,
  getAccounts,
  (holidays, accounts) => {
    const toBeLoaded = []
    for (const id of Object.keys(accounts)) {
      const account = accounts[id]
      if (
        !holidays ||
        !holidays[
          `${account.country}/${account.state}/${account.city}`
        ]
      ) {
        toBeLoaded.push(account)
      }
    }
    if (toBeLoaded.length > 0) {
      loadHolidays(holidays, toBeLoaded)
    }
    return holidays
  }
)

export const getPartitions = (id, invoices) => {
  const seek = (id, amount) => {
    const isBilledDoc = typeof amount === 'number'
    const [invoiceId, parcelIndex] = getIdAndParcelIndex(id)
    const doc = invoices[invoiceId]
    const invoicePartitions =
      (typeof parcelIndex === 'number' &&
        doc.parcels[parcelIndex].partitions) ||
      doc.partitions
    if (invoicePartitions) {
      return isBilledDoc
        ? redistributeAmount(invoicePartitions, amount)
        : invoicePartitions
    }
    let mergedPartitions = []
    for (const billedInvoice of doc.billedFrom) {
      const {id, partitions, ...rest} = billedInvoice
      if (partitions) {
        mergedPartitions = [
          ...mergedPartitions,
          ...partitions.map(partition => ({
            ...(id ? {id} : {}),
            ...rest,
            ...partition
          }))
        ]
      } else if (id) {
        mergedPartitions = [
          ...mergedPartitions,
          ...seek(id, isBilledDoc ? amount : billedInvoice.amount)
        ]
      } else {
        mergedPartitions.push({
          amount,
          ...rest
        })
      }
    }
    return mergedPartitions
  }
  return seek(id)
}

export const getDueDatesForCreditcard = ({
  account,
  from,
  to,
  holidays
}) => {
  const result = []
  const {dueDay} = account
  let month = extractYearMonth(from)
  to = to || addMonths(month, MONTHS_FOR_CREDITCARD_DUE_DATES)
  while (month <= to) {
    const lengthOfMonth = getLengthOfMonth(month)
    const dueDayInThisMonth =
      dueDay > lengthOfMonth ? lengthOfMonth : dueDay
    let dueDate = setDayOfMonth(month, dueDayInThisMonth)
    while (!isBusinessDay(dueDate, holidays, account)) {
      dueDate = addDays(dueDate, 1)
    }
    result.push(dueDate)
    month = addMonths(month, 1)
  }
  return result
}

export const expandInvoice = (id, {invoices, holidays, accounts}) => {
  const transactions = []
  const {parcels, billedFrom, ...invoice} = invoices[id]
  for (const [parcelIndex, parcel] of parcels.entries()) {
    let partitions = parcel.partitions || invoice.partitions
    if (!partitions) {
      partitions = getPartitions(id, invoices)
    }
    const transaction = {
      ...invoice,
      ...parcel,
      id: `${id}/${parcelIndex + 1}`,
      partitions: redistributeAmount(
        partitions,
        parcel.paidAmount || parcel.amount
      )
    }
    transactions.push(transaction)
    if (transaction.type === 'ccard') {
      // todo
    }
  }
  return transactions
}

export const getTransactionsByDay = createSelector(
  createStructuredSelector({
    from: (state, {from} = {}) => from || today(),
    to: (state, {to} = {}) => to,
    invoices: getInvoices,
    budgets: getBudgets,
    transfers: getTransfers,
    holidays: getHolidaysForAccounts, // for business days
    accounts: getAccounts // fot credit cards due dates
  }),
  params => {
    let {
      from,
      to,
      holidays,
      invoices,
      budgets,
      transfers,
      accounts
    } = params
    const transactions = []
    if (
      !areAllCollectionsReady({
        invoices,
        budgets,
        transfers,
        accounts
      })
    ) {
      return transactions
    }
    to = to && to >= from ? to : from
    for (const id of Object.keys(invoices)) {
      transactions.concat(
        expandInvoice(id, {invoices, holidays, accounts})
      )
    }
    return transactions
  }
)
