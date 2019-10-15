import get from 'lodash/get'
import set from 'lodash/set'
import sumBy from 'lodash/sumBy'
import sortBy from 'lodash/sortBy'
import debug from 'debug'

import {
  subscribeCollection,
  convertRecordTimestamps
} from '../controller'
import {getDb, getUid} from './app'
import {
  toYearMonth,
  addMonths,
  extractYearMonth,
  getCurrentDate,
  getLengthOfMonth,
  setDayOfMonth,
  addDays,
  setMonthAndDayOfMonth,
  extractYear,
  setDayOfWeek,
  addWeeks,
  getMonthsUntil,
  getWeeksUntil,
  getCurrentMonth,
  toDateString,
  extractMonth,
  getStartOfMonth,
  MINUTE
} from '../lib/date'
import {
  createSelector,
  createStructuredSelector,
  memoize
} from '../lib/reselect'
import {
  getHolidays,
  loadHolidays,
  isBusinessDay,
  getCountryCurrency,
  getCurrencies
} from './atlas'
import t from '../lib/translate'
import {formatCurrency} from '../lib/format'
import {getHierarchy} from './tree'
import {getPin} from './pin'

// eslint-disable-next-line no-unused-vars
const log = debug('selectors:docs')

const UNCLASSIFIED = 'UNCLASSIFIED'
const PREVIOUS_MONTHS_TO_BE_CACHED = 3
const BUDGET_VALIDITY = PREVIOUS_MONTHS_TO_BE_CACHED
const RECENT_ACTIVITY_ITEMS = 100
export const CREATED = 'created'
export const UPDATED = 'updated'
export const DELETED = 'deleted'
const MIN_ELAPSED_TIME_FROM_CREATE_TO_REPORT_UPDATE = 5 * MINUTE

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

const getMonthSpan = memoize((from, to, currentMonth) => {
  to = (to && toYearMonth(to)) || currentMonth
  if (to > currentMonth) {
    to = currentMonth
  }
  from = (from && toYearMonth(from)) || currentMonth
  if (from > currentMonth) {
    from = currentMonth
  }
  from = addMonths(from, -PREVIOUS_MONTHS_TO_BE_CACHED)
  const monthSpan = ['*']
  while (from <= to) {
    monthSpan.push(extractYearMonth(from))
    from = addMonths(from, 1)
  }
  return monthSpan
})

const getIdAndParcelIndex = id => {
  let [invoiceId, parcelIndex] = id.split('/')
  if (parcelIndex) {
    parcelIndex = Number(parcelIndex) - 1
  }
  return [invoiceId, parcelIndex]
}

export const invoiceTransform = (data, id, doc) => {
  if (doc.billedFrom) {
    doc.billedFrom = doc.billedFrom.map(item => {
      let {id, doc, ...rest} = item
      if (id && doc) {
        const [invoiceId] = getIdAndParcelIndex(id)
        doc = {...doc}
        convertRecordTimestamps(doc)
        data[invoiceId] = doc
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
    monthSpan: getMonthSpan(from, to, getCurrentMonth())
  })

export const getBudgets = state =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/budgets`
  })

export const getTransfers = (state, {from, to} = {}) =>
  getCollection(state, {
    collection: `dbs/${getDb(state)}/transfers`,
    monthSpan: getMonthSpan(from, to, getCurrentMonth())
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

export const getCategoriesWithDescription = createSelector(
  getCategories,
  categories => {
    if (categories) {
      categories = {...categories}
      const roots = ['income', 'expense']
      for (const id of Object.keys(categories)) {
        const category = (categories[id] = {...categories[id]})
        const hierarchy = (category.hierarchy = getHierarchy(
          id,
          categories,
          roots
        ))
        category.description = category.name
        if (hierarchy) {
          category.type = hierarchy[hierarchy.length - 1]
          category.description = concatDescription(
            category.description,
            hierarchy
              .slice(0, -1)
              .map(id => categories[id].name)
              .join('; '),
            ' ' + t`at` + ' '
          )
        } else {
          category.type = category.id
        }
      }
    }
    return categories
  }
)

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

export const getUser = state =>
  getCollection(state, {
    collection: `users/${getUid(state)}`
  })

export const getCurrencyRates = state =>
  getCollection(state, {
    collection: 'atlas/currencyRates'
  })

export const getDefaultCurrency = state => {
  const user = getUser(state)
  return user && getCountryCurrency(state, {country: user.country})
}

export const isCreditcard = type => type === 'creditcard'

export const isCreditcardAccount = (id, accounts = {}) =>
  isCreditcard((accounts[id] || {}).type)

export const getDocProp = (id, path, collection, defaultValue = '') =>
  get(collection[id], path) || defaultValue

export const getName = (id, collection) =>
  getDocProp(id, 'name', collection)

export const isAcquittance = status =>
  status === 'due' || status === 'paid' || status === 'draft'

export const isDue = status => status === 'due' || status === 'draft'

export const concatDescription = (
  description,
  complement,
  separator = '. '
) =>
  `${description || ''}${
    description && complement ? separator : ''
  }${complement || ''}`

export const getDescriptionFromPartitions = (
  partitions,
  categories
) => {
  let description
  let lastCategory = null
  for (const partition of partitions) {
    const partitionDescription =
      partition.description && partition.description.trim()
    if (partitionDescription) {
      description = concatDescription(
        description,
        partitionDescription
      )
      lastCategory = partition.category
    } else if (partition.category !== lastCategory) {
      lastCategory = partition.category
      description = concatDescription(
        description,
        getName(partition.category, categories)
      )
    }
  }
  return description
}

const buildTransactionDescription = (
  transaction,
  {categories, places}
) => {
  let description = transaction.description
  description = concatDescription(description, transaction.notes)
  if (transaction.partitions) {
    description = concatDescription(
      getDescriptionFromPartitions(transaction.partitions, categories)
    )
  }
  if (transaction.installments > 1) {
    const {installment, installments} = transaction
    description = concatDescription(
      description,
      t`Installment` + ` ${installment} ` + t`of` + ` ${installments}`
    )
  }
  if (
    transaction.payDate &&
    transaction.payDate !== transaction.dueDate
  ) {
    description = concatDescription(
      description,
      toDateString(transaction.payDate),
      ' - '
    )
  }
  if (transaction.place) {
    description = concatDescription(
      description,
      getName(transaction.place, places),
      ' ▪ '
    )
  }
  return description
}

export const getTotal = recordset => sumBy(recordset, 'amount')

export const getInvoiceTotal = ({amount = 0, parcels = []}) =>
  getTotal([{amount}, ...parcels])

export const redistributeAmount = (partitions, newAmount) => {
  const total = getTotal(partitions)
  const k = newAmount / total
  let remainder = newAmount
  const result = []
  for (const partition of partitions) {
    const partial = Math.round(k * partition.amount)
    remainder -= partial
    result.push({
      ...partition,
      amount: partial
    })
  }
  if (remainder !== 0 && result.length) {
    const lastIndex = result.length - 1
    result[lastIndex].amount += remainder
  }
  return result
}

export const getHolidaysForAccounts = createSelector(
  getHolidays,
  getAccounts,
  (holidays, accounts) => {
    if (
      !areAllCollectionsReady({
        accounts
      })
    ) {
      return {}
    }
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
    const {billedFrom} = doc
    if (!billedFrom) {
      return [{amount: isBilledDoc ? amount : getInvoiceTotal(doc)}]
    }
    let mergedPartitions = []
    for (const billedInvoice of billedFrom) {
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
          amount: isBilledDoc ? amount : billedInvoice.amount,
          ...rest
        })
      }
    }
    return mergedPartitions
  }
  return seek(id)
}

export const getInvoicesLastBill = memoize(invoices => {
  const invoicesLastBill = {issuers: {}, invoices: {}}
  for (const id of Object.keys(invoices || {})) {
    if (invoices[id].billedFrom) {
      const {issuer, issueDate, billedFrom} = invoices[id]
      if (issuer) {
        const lastBill = invoicesLastBill.issuers[issuer]
        if (!lastBill || issueDate > lastBill.issueDate) {
          invoicesLastBill.issuers[issuer] = {issueDate}
        }
      }
      for (const invoice of billedFrom) {
        if (invoice.id) {
          const lastBill = invoicesLastBill.invoices[invoice.id]
          if (
            !lastBill ||
            invoice.installment > lastBill.installment
          ) {
            invoicesLastBill.invoices[invoice.id] = invoice
          }
        }
      }
    }
  }
  return invoicesLastBill
})

export const getRemainingPaymentsForCreditcard = ({
  transaction,
  accounts,
  holidays,
  invoicesLastBill
}) => {
  const {installments = 1} = transaction
  const billedDate =
    transaction.payDate ||
    transaction.dueDate ||
    transaction.issueDate
  const account = accounts[transaction.account]
  const {bestDay, dueDay} = account
  const lastIssuerBill = invoicesLastBill.issuers[transaction.account]

  let firstPayment

  const getDueDateInMonth = month => {
    const lengthOfMonth = getLengthOfMonth(month)
    const dueDayInThisMonth =
      dueDay > lengthOfMonth ? lengthOfMonth : dueDay
    return setDayOfMonth(month, dueDayInThisMonth)
  }

  const getFirstPayment = () => {
    if (!firstPayment) {
      firstPayment = getDueDateInMonth(billedDate)
      if (firstPayment <= billedDate) {
        firstPayment = getDueDateInMonth(addMonths(firstPayment, 1))
      }
      let bestDate
      if (bestDay > dueDay) {
        bestDate = setDayOfMonth(addMonths(firstPayment, -1), bestDay)
      } else {
        bestDate = setDayOfMonth(firstPayment, bestDay)
      }
      if (billedDate >= bestDate) {
        firstPayment = addMonths(firstPayment, 1)
      }
    }
    return firstPayment
  }

  const getInstallmentIssueDate = installment => {
    let issueDate = getDueDateInMonth(
      addMonths(getFirstPayment(), installment - 1)
    )
    if (lastIssuerBill) {
      while (issueDate <= lastIssuerBill.issueDate) {
        issueDate = getDueDateInMonth(addMonths(issueDate, 1))
      }
    }
    return issueDate
  }

  const payAccount = accounts[transaction.payAccount] || account
  const getDueDate = issueDate => {
    let dueDate = issueDate
    while (!isBusinessDay(dueDate, payAccount, holidays)) {
      dueDate = addDays(dueDate, 1)
    }
    return dueDate
  }

  let balance
  let installment
  const payments = []
  const lastBill = invoicesLastBill.invoices[transaction.id]
  if (lastBill) {
    balance =
      typeof lastBill.balance === 'number' ? lastBill.balance : 0
    installment = lastBill.installment || 1
  } else {
    balance = transaction.amount
    installment = 0
  }
  while (installment < installments) {
    const remainingInstallments = installments - installment
    const amount =
      remainingInstallments === 1
        ? balance
        : Math.trunc(balance / remainingInstallments)
    installment++
    balance -= amount
    const issueDate = getInstallmentIssueDate(installment)
    const {payDate, ...relay} = transaction
    payments.push({
      ...relay,
      id: `${transaction.id}@${issueDate}`,
      billedFrom: transaction.id,
      type: 'payment',
      amount,
      status: 'draft',
      issueDate,
      billedDate,
      dueDate: getDueDate(issueDate),
      account: account.payAccount || transaction.account,
      issuer: transaction.account,
      partitions: redistributeAmount(transaction.partitions, amount),
      installment,
      installments,
      balance
    })
  }
  return payments
}

export const expandInvoice = (id, invoice, collections) => {
  let transactions = []
  const {invoices, holidays, accounts} = collections
  const {parcels = [], billedFrom, ...rawInvoice} = invoice
  let parcelIndex = 0
  const addTransaction = transaction => {
    transaction.id = id
    if (isCreditcardAccount(transaction.account, accounts)) {
      transactions = [
        ...transactions,
        ...[
          transaction,
          ...getRemainingPaymentsForCreditcard({
            transaction,
            accounts,
            holidays,
            invoicesLastBill: getInvoicesLastBill(invoices)
          })
        ].map(transaction => ({
          ...transaction,
          description: buildTransactionDescription(
            transaction,
            collections
          )
        }))
      ]
    } else {
      if (parcels.length > 0) {
        transaction.installment = parcelIndex + 1
        transaction.installments = parcels.length + 1
        if (parcelIndex > 0) {
          transaction.id = `${id}/${parcelIndex}`
        }
        parcelIndex++
      }
      transaction.description = buildTransactionDescription(
        transaction,
        collections
      )
      transactions.push(transaction)
    }
  }

  let partitions = invoice.partitions
  if (!partitions) {
    partitions = getPartitions(id, invoices)
  }
  addTransaction({
    ...rawInvoice,
    id,
    partitions: redistributeAmount(
      partitions,
      invoice.paidAmount || invoice.amount
    )
  })
  for (const parcel of parcels) {
    partitions = parcel.partitions || partitions
    const {payDate, ...rawParcel} = rawInvoice
    addTransaction({
      ...rawParcel,
      ...parcel,
      partitions: redistributeAmount(
        partitions,
        parcel.paidAmount || parcel.amount
      )
    })
  }
  return transactions
}

const getActualDueDate = (
  dueDate,
  {holidays, region, onlyInBusinessDays}
) => {
  if (!onlyInBusinessDays) {
    return dueDate
  }
  const interval = onlyInBusinessDays === 'previous' ? -1 : 1
  while (!isBusinessDay(dueDate, region, holidays)) {
    dueDate = addDays(dueDate, interval)
  }
  return dueDate
}

export const getMonthlyDueDates = (
  from,
  to,
  {
    dayOfMonth,
    onlyInBusinessDays,
    holidays,
    region,
    interval = 1,
    startedAt
  }
) => {
  const dueDates = []
  let date = from
  if (startedAt && interval > 1) {
    date = addMonths(date, getMonthsUntil(startedAt, date) % interval)
  }
  const isMonthly = !dayOfMonth
  let fromMonth
  let toMonth
  if (isMonthly) {
    fromMonth = extractYearMonth(from)
    toMonth = extractYearMonth(from)
  }
  const scanUntil = addMonths(to, interval)
  while (date <= scanUntil) {
    if (isMonthly) {
      const month = extractYearMonth(date)
      if (month >= fromMonth && month <= toMonth) {
        dueDates.push([month, month])
      }
    } else {
      date = setDayOfMonth(date, dayOfMonth)
      const dueDate = getActualDueDate(date, {
        onlyInBusinessDays,
        holidays,
        region
      })
      if (dueDate >= from && dueDate <= to) {
        dueDates.push([date, dueDate])
      }
    }
    date = extractYearMonth(addMonths(date, interval))
  }
  return dueDates
}

export const getYearlyDueDates = (
  from,
  to,
  {
    dayOfMonth,
    months,
    onlyInBusinessDays,
    holidays,
    region,
    interval = 1,
    startedAt
  }
) => {
  const dueDates = []
  let year = Number(extractYear(from))
  if (startedAt && interval > 1) {
    year += (year - Number(extractYear(startedAt))) % interval
  }
  const isMonthly = !dayOfMonth
  let fromMonth
  let toMonth
  if (isMonthly) {
    fromMonth = extractYearMonth(from)
    toMonth = extractYearMonth(from)
  }
  const scanUntil = Number(extractYear(to)) + interval
  while (year <= scanUntil) {
    for (const month of months) {
      if (isMonthly) {
        const yearMonth = extractYearMonth(
          setMonthAndDayOfMonth(year, month, 1)
        )
        if (yearMonth >= fromMonth && yearMonth <= toMonth) {
          dueDates.push([yearMonth, yearMonth])
        }
      } else {
        const date = setMonthAndDayOfMonth(year, month, dayOfMonth)
        const dueDate = getActualDueDate(date, {
          onlyInBusinessDays,
          holidays,
          region
        })
        if (dueDate >= from && dueDate <= to) {
          dueDates.push([date, dueDate])
        }
      }
    }
    year += interval
  }
  return dueDates
}

export const getWeeklyDueDates = (
  from,
  to,
  {
    dayOfWeek,
    onlyInBusinessDays,
    holidays,
    region,
    interval = 1,
    startedAt
  }
) => {
  const dueDates = []
  let date = from
  if (startedAt && interval > 1) {
    date = addWeeks(date, getWeeksUntil(startedAt, date) % interval)
  }
  const scanUntil = addWeeks(to, interval)
  while (date <= scanUntil) {
    date = setDayOfWeek(date, dayOfWeek)
    const dueDate = getActualDueDate(date, {
      onlyInBusinessDays,
      holidays,
      region
    })
    if (dueDate >= from && dueDate <= to) {
      dueDates.push([date, dueDate])
    }
    date = addWeeks(date, interval)
  }
  return dueDates
}

export const getInvoicesByBudget = memoize(invoices => {
  const invoicesByBudget = new Set()
  for (const id of Object.keys(invoices || {})) {
    if (invoices[id].budget) {
      const invoice = invoices[id]
      invoicesByBudget.add(`${invoice.budget}@${invoice.issueDate}`)
    }
  }
  return invoicesByBudget
})

export const isVariableCost = type => type === 'mbud'

export const expandBudget = (id, from, to, collections) => {
  let transactions = []
  const {budget, holidays, accounts, invoices, region} = collections
  if (process.env.NOD_ENV !== 'production') {
    if (isVariableCost(budget.type)) {
      throw new Error('Variable cost budgets cannot be expanded')
    }
  }
  const reviews = sortBy(
    [
      budget,
      ...(budget.reviews || []).map(review => ({
        ...budget,
        ...review
      }))
    ],
    'date'
  )
  const startedAt = budget.date
  for (const [index, review] of reviews.entries()) {
    const {date, endedAt} = review
    const reviewStartsAt = date
    let reviewEndsAt = endedAt
    const nextReviewIndex = index + 1
    if (reviews.length > nextReviewIndex) {
      reviewEndsAt = addDays(reviews[nextReviewIndex].date, -1)
      if (endedAt < reviewEndsAt) {
        reviewEndsAt = endedAt
      }
    }
    if (from > reviewEndsAt) {
      continue
    }
    if (to < reviewStartsAt) {
      break
    }
    const startsAt = from > reviewStartsAt ? from : reviewStartsAt
    const endsAt = to > reviewEndsAt ? reviewEndsAt : to
    let f
    switch (review.frequency) {
      case 'weekly':
        f = getWeeklyDueDates
        break
      case 'monthly':
        f = getMonthlyDueDates
        break
      case 'yearly':
        f = getYearlyDueDates
        break
      default:
        f = () => [[endedAt, endedAt]]
    }
    const dueDates = f(startsAt, endsAt, {
      ...budget,
      holidays,
      region: review.account ? accounts[review.account] : region,
      startedAt
    })
    const invoicesByBudget = getInvoicesByBudget(invoices)
    for (const [issueDate, dueDate] of dueDates) {
      const issueId = `${id}@${issueDate}`
      if (
        invoicesByBudget.has(issueId) ||
        invoicesByBudget.has(`${id}@${dueDate}`)
      ) {
        continue
      }
      const amount = getTotal(review.partitions)
      const invoice = {
        type: review.type,
        place: review.place,
        notes: review.notes,
        status: 'due',
        currency: review.currency,
        partitions: review.partitions,
        issueDate,
        dueDate,
        amount,
        account: review.account
      }
      if (isCreditcardAccount(review.account, accounts)) {
        if (review.installments) {
          invoice.installments = review.installments
        }
      }
      transactions = [
        ...transactions,
        ...expandInvoice(issueId, invoice, collections)
      ]
    }
  }
  return transactions
}

export const getInvoicesTransactions = createSelector(
  createStructuredSelector({
    invoices: getInvoices,
    holidays: getHolidaysForAccounts,
    accounts: getAccounts,
    categories: getCategories,
    places: getPlaces
  }),
  params => {
    const {holidays, invoices, accounts, categories, places} = params
    let transactions = []
    if (
      !areAllCollectionsReady({
        invoices,
        accounts,
        holidays,
        categories,
        places
      })
    ) {
      return transactions
    }
    log('getInvoicesTransactions started', params)
    for (const id of Object.keys(invoices)) {
      transactions = [
        ...transactions,
        ...expandInvoice(id, invoices[id], {
          invoices,
          holidays,
          accounts,
          categories,
          places
        })
      ]
    }
    return transactions
  }
)

export const getTransfersTransactions = createSelector(
  getTransfers,
  getAccounts,
  (transfers, accounts) => {
    let transactions = []
    if (
      !areAllCollectionsReady({
        transfers,
        accounts
      })
    ) {
      return transactions
    }
    log('getTransfersTransactions started')
    for (const id of Object.keys(transfers)) {
      let {
        amount,
        date,
        account,
        description,
        counterpart,
        createdAt
      } = transfers[id]
      const isTransfer = Boolean(counterpart)
      const type = isTransfer
        ? 'transfer'
        : Math.isNegative(amount)
        ? 'balance-out'
        : 'balance-in'
      if (isTransfer) {
        let from
        let to
        if (Math.isNegative(amount)) {
          from = getName(account, accounts)
          to = getName(counterpart, accounts)
        } else {
          from = getName(counterpart, accounts)
          to = getName(account, accounts)
        }
        description = concatDescription(
          t`Transfer from` + ' ' + from + ' ' + t`to` + ' ' + to,
          description
        )
      } else if (!description) {
        description =
          t`Balance adjustment` + ' ' + getName(account, accounts)
      }
      const transaction = {
        id,
        type,
        description,
        dueDate: date,
        account,
        amount,
        createdAt
      }
      if (isTransfer) {
        transaction.counterpart = counterpart
      }
      transactions = [...transactions, transaction]
    }
    log('getTransfersTransactions ended', transactions)
    return transactions
  }
)

export const getVariableCostTransactions = createSelector(
  createStructuredSelector({
    from: (state, {from} = {}) =>
      from === null
        ? addMonths(getCurrentDate(), -BUDGET_VALIDITY)
        : from || getCurrentDate(),
    to: (state, {to} = {}) => to,
    transactions: getInvoicesTransactions,
    budgets: getBudgets,
    categories: getCategoriesWithDescription
  }),
  params => {
    let {from, to, transactions, budgets, categories} = params
    const vCostTransactions = []
    if (
      !areAllCollectionsReady({
        budgets,
        categories
      })
    ) {
      return vCostTransactions
    }
    const vCost = {}
    for (const transaction of transactions) {
      if (!transaction.budget && isAcquittance(transaction.status)) {
        const month = extractYearMonth(
          transaction.payDate ||
            transaction.dueDate ||
            transaction.issueDate
        )
        for (const partition of transaction.partitions) {
          const {
            category = UNCLASSIFIED,
            costCenter = UNCLASSIFIED,
            amount
          } = partition
          const key = `${month}:${category}`
          const budget = vCost[key] || {
            partitions: [],
            amount: 0,
            month
          }
          const costCenterPartition = budget.partitions.find(
            partition => partition.costCenter === costCenter
          )
          if (costCenterPartition) {
            costCenterPartition.amount += amount
            costCenterPartition.transactions.push({
              transaction,
              partition
            })
          } else {
            budget.partitions.push({
              category,
              costCenter,
              amount,
              transactions: [{transaction, partition}]
            })
          }
          budget.amount += amount
          vCost[key] = budget
        }
      }
    }

    from = extractYearMonth(from)
    to = extractYearMonth(to)
    for (const id of Object.keys(budgets)) {
      const budget = budgets[id]
      if (!isVariableCost(budget.type)) {
        continue
      }
      const reviews = sortBy(
        [
          budget,
          ...(budget.reviews || []).map(review => ({
            ...budget,
            ...review
          }))
        ],
        'date'
      )
      for (const [index, review] of reviews.entries()) {
        const {date, endedAt} = review
        const reviewStartsAt = extractYearMonth(date)
        let reviewEndsAt = extractYearMonth(endedAt)
        const nextReviewIndex = index + 1
        if (reviews.length > nextReviewIndex) {
          reviewEndsAt = extractYearMonth(
            addMonths(reviews[nextReviewIndex].date, -1)
          )
          if (endedAt < reviewEndsAt) {
            reviewEndsAt = endedAt
          }
        }
        if (from > reviewEndsAt) {
          continue
        }
        if (to < reviewStartsAt) {
          break
        }
        const startsAt = from > reviewStartsAt ? from : reviewStartsAt
        const endsAt = to > reviewEndsAt ? reviewEndsAt : to
        for (
          let month = startsAt;
          month <= endsAt;
          month = extractYearMonth(addMonths(month, 1))
        ) {
          if (
            review.frequency === 'yearly' &&
            !review.months.includes(Number(extractMonth(month)))
          ) {
            continue
          }
          let costKey
          let cost
          let transaction
          let amount = 0
          let forecast = 0
          for (const partition of review.partitions) {
            const {category, costCenter} = partition
            if (partition.amount === 0) {
              continue
            }
            if (!transaction) {
              costKey = `${month}:${category}`
              cost = vCost[costKey]
              transaction = {
                id: `${id}@${month}:${category}`,
                type: get(categories[category], 'type'),
                description: get(categories[category], 'description'),
                month,
                partitions: [],
                cost
              }
            }
            let costAmount = 0
            if (cost) {
              if (costCenter) {
                const costPartition = cost.partitions.find(
                  partition => partition.costCenter === costCenter
                )
                if (costPartition) {
                  costAmount = costPartition.amount
                }
                transaction.partitions.push({
                  ...partition,
                  forecast: partition.amount,
                  amount: costAmount
                })
              } else {
                for (const costPartition of cost.partitions) {
                  costAmount += costPartition.amount
                  transaction.partitions.push({
                    ...partition,
                    costCenter: costPartition.costCenter,
                    forecast: partition.amount,
                    amount: costPartition.amount
                  })
                }
              }
            }
            amount += costAmount
            forecast += partition.amount
          }
          if (transaction) {
            transaction.forecast = forecast
            transaction.amount = amount
            vCostTransactions.push(transaction)
            if (cost) {
              delete vCost[costKey]
            }
          }
        }
      }
    }
    for (const key of Object.keys(vCost)) {
      const cost = vCost[key]
      if (cost.month >= from && cost.month <= to) {
        const [, category] = key.split(':')
        vCostTransactions.push({
          id: key,
          ...cost,
          type: get(categories[category], 'type'),
          description: get(categories[category], 'description')
        })
      }
    }
    return vCostTransactions
  }
)

export const getBudgetsTransactions = createSelector(
  createStructuredSelector({
    from: (state, {from} = {}) =>
      from === null
        ? addMonths(getCurrentDate(), -BUDGET_VALIDITY)
        : from || getCurrentDate(),
    to: (state, {to} = {}) => to,
    invoices: getInvoices,
    budgets: getBudgets,
    holidays: getHolidaysForAccounts,
    accounts: getAccounts,
    categories: getCategoriesWithDescription,
    places: getPlaces,
    region: getUser
  }),
  params => {
    const {
      from,
      to,
      holidays,
      invoices,
      budgets,
      accounts,
      categories,
      places,
      region
    } = params
    let transactions = []
    if (
      !areAllCollectionsReady({
        budgets,
        invoices,
        accounts,
        holidays,
        categories,
        places
      })
    ) {
      return transactions
    }
    log('getBudgetsTransactions started', params)
    for (const id of Object.keys(budgets)) {
      const budget = budgets[id]
      if (!isVariableCost(budget.type)) {
        transactions = [
          ...transactions,
          ...expandBudget(id, from, to, {
            budget,
            invoices,
            holidays,
            accounts,
            region,
            categories,
            places
          })
        ]
      }
    }
    return transactions
  }
)

export const getCurrencyRate = (currencyRates = {}, from, to) => {
  const rates = currencyRates.rates || {}
  let rate
  if (from !== currencyRates.base) {
    if (rates[from] && rates[to]) {
      const k = 1 / rates[from]
      rate = rates[to] * k
    }
  } else {
    rate = rates[to]
  }
  return typeof rate === 'number' ? rate : 1
}

export const convertTransactionCurrency = (
  transaction,
  {
    currencies,
    currencyRates,
    defaultCurrency,
    toCurrency = defaultCurrency
  }
) => {
  if (!currencies || !currencyRates || !defaultCurrency) {
    return transaction
  }
  transaction = {...transaction}
  transaction.currency = transaction.currency || defaultCurrency
  const attachCurrency = () => {
    transaction.currency = toCurrency
    transaction.currencySymbol =
      currencies[toCurrency].symbol || toCurrency
  }
  if (transaction.currency === toCurrency) {
    attachCurrency()
    return transaction
  }
  transaction.currency = transaction.currency || defaultCurrency
  if (transaction.rate) {
    transaction.amount = Math.round(
      transaction.amount * transaction.rate
    )
    transaction.currency = defaultCurrency
    delete transaction.rate
  }
  if (transaction.currency !== toCurrency) {
    transaction.amount = Math.round(
      transaction.amount *
        getCurrencyRate(
          currencyRates,
          transaction.currency,
          toCurrency
        )
    )
  }
  transaction.partitions = redistributeAmount(
    transaction.partitions,
    transaction.amount
  )
  attachCurrency()
  return transaction
}

export const getTimePeriods = memoize(today => {
  const tomorrow = addDays(today, 1)
  const nextWeek = addDays(today, 7)
  const nextMonth = addMonths(today, 1)
  const yesterday = addDays(today, -1)
  const lastWeek = addDays(today, -7)
  const lastMonth = addMonths(today, -1)
  return [
    {
      name: t`In a month`,
      from: addDays(nextWeek, 1),
      to: nextMonth
    },
    {
      name: t`In a week`,
      from: addDays(tomorrow, 1),
      to: nextWeek
    },
    {
      name: t`Tomorrow`,
      from: tomorrow,
      to: tomorrow
    },
    {
      name: t`Today`,
      from: today,
      to: today
    },
    {
      name: t`Yesterday`,
      from: yesterday,
      to: yesterday
    },
    {
      name: t`From a week`,
      from: lastWeek,
      to: addDays(yesterday, -1)
    },
    {
      name: t`From a month`,
      from: lastMonth,
      to: addDays(lastWeek, -1)
    },
    {
      name: t`Older`,
      to: addDays(lastMonth, -1)
    }
  ]
})

export const getTransactions = createSelector(
  createStructuredSelector({
    from: (state, {from} = {}) =>
      from === undefined ? getCurrentDate() : from,
    to: (state, {to} = {}) => to,
    filter: (state, {filter} = {}) => filter,
    invoicesTransactions: getInvoicesTransactions,
    transfersTransactions: getTransfersTransactions,
    budgetsTransactions: getBudgetsTransactions,
    currencies: getCurrencies,
    currencyRates: getCurrencyRates,
    defaultCurrency: getDefaultCurrency
  }),
  params => {
    const {
      from,
      to,
      filter,
      invoicesTransactions,
      transfersTransactions,
      budgetsTransactions,
      ...currenciesConversionData
    } = params
    const transactions = [
      ...invoicesTransactions,
      ...transfersTransactions,
      ...budgetsTransactions
    ]
    const selected = []
    for (const transaction of transactions) {
      const date = transaction.dueDate
      if (process.env.NOD_ENV !== 'production') {
        if (!date) {
          throw new Error(
            `Transaction has no due date: ${JSON.stringify(
              transaction
            )}`
          )
        }
      }
      if ((!from || date >= from) && date <= to) {
        if (!filter || filter(transaction)) {
          selected.push(
            convertTransactionCurrency(
              transaction,
              currenciesConversionData
            )
          )
        }
      }
    }
    log('getTransactions result', selected)
    return selected
  }
)

export const getTransactionsByDay = createSelector(
  getTransactions,
  transactions => {
    transactions = sortBy(transactions, ['dueDate', 'createdAt'])
    const calendar = {}
    for (const transaction of transactions) {
      const date = transaction.dueDate
      calendar[date] = calendar[date] || []
      if (
        transaction.type === 'payment' &&
        transaction.status === 'draft' &&
        transaction.issuer
      ) {
        const draft = calendar[date].find(
          t =>
            t.type === 'bill' &&
            t.status === 'draft' &&
            t.issuer === transaction.issuer
        )
        if (draft) {
          draft.amount += transaction.amount
          draft.description = concatDescription(
            draft.description,
            `${transaction.description} $ ${formatCurrency(
              transaction.amount
            )}`,
            ' / '
          )
          draft.payments.push(transaction)
        } else {
          calendar[date].push({
            id: `${transaction.issuer}@${date}`,
            type: 'bill',
            status: 'draft',
            description: concatDescription(
              t`Credit card purchases`,
              `${transaction.description} $ ${formatCurrency(
                transaction.amount
              )}`,
              ': '
            ),
            issuer: transaction.issuer,
            issueDate: transaction.issueDate,
            dueDate: date,
            amount: transaction.amount,
            account: transaction.account,
            payments: [transaction]
          })
        }
      } else {
        calendar[date].push(transaction)
      }
    }
    log('getTransactionsByDay result', calendar)
    return calendar
  }
)

export const getTransactionsByTimePeriods = createSelector(
  getTransactionsByDay,
  (state, {today}) => getTimePeriods(today),
  (calendar, timePeriods) => {
    timePeriods = timePeriods.map(timePeriod => ({
      ...timePeriod
    }))
    for (const date of Object.keys(calendar)) {
      for (const timePeriod of timePeriods) {
        if (
          (!timePeriod.from || date >= timePeriod.from) &&
          date <= timePeriod.to
        ) {
          timePeriod.calendar = {
            ...(timePeriod.calendar || {}),
            [date]: calendar[date]
          }
        }
      }
    }
    return timePeriods
  }
)

export const getAccountsBalance = createSelector(
  createStructuredSelector({
    accounts: getAccounts,
    defaultCurrency: getDefaultCurrency,
    currencyRates: getCurrencyRates,
    transactions: getInvoicesTransactions
  }),
  params => {
    const {
      accounts,
      defaultCurrency,
      currencyRates,
      transactions
    } = params
    const accountsBalance = {}
    if (
      !areAllCollectionsReady({
        accounts,
        currencyRates
      })
    ) {
      return accountsBalance
    }
    const creditcardBalance = {}
    for (const transaction of transactions) {
      const {issuer, status} = transaction
      if (isCreditcardAccount(issuer, accounts) && isDue(status)) {
        creditcardBalance[issuer] = creditcardBalance[issuer] || {
          balance: 0,
          bills: {}
        }
        creditcardBalance[issuer].balance += transaction.amount
        const {dueDate} = transaction
        const bill = (creditcardBalance[issuer].bills[
          dueDate
        ] = creditcardBalance[issuer].bills[dueDate] || {
          balance: 0,
          transactions: []
        })
        bill.balance += transaction.amount
        bill.transactions.push(transaction)
      }
    }
    for (const id of Object.keys(accounts)) {
      const account = accounts[id]
      let bills
      if (!account.deletedAt) {
        const {type} = account
        let balance
        if (isCreditcard(type)) {
          balance = get(creditcardBalance, `${id}.balance`, 0)
          const issuerBills = get(
            creditcardBalance,
            `${id}.bills`,
            {}
          )
          bills = Object.keys(issuerBills)
            .sort()
            .map(dueDate => {
              return {
                dueDate,
                balance: issuerBills[dueDate].balance,
                transactions: issuerBills[dueDate].transactions
              }
            })
        } else {
          balance = account.balance || 0
        }
        if (account.currency !== defaultCurrency) {
          balance = Math.round(
            balance *
              getCurrencyRate(
                currencyRates,
                account.currency,
                defaultCurrency
              )
          )
        }
        accountsBalance[type] = accountsBalance[type] || []
        accountsBalance[type].push({
          id,
          balance,
          account,
          bills
        })
      }
    }
    return accountsBalance
  }
)

export const sumAccountsBalance = createSelector(
  getAccountsBalance,
  getPin,
  (accountsBalance, pin) => {
    const result = {total: 0}
    for (const type of Object.keys(accountsBalance)) {
      let typeTotal = 0
      let pinned
      let pinnedTypeTotal = 0
      for (const ab of accountsBalance[type]) {
        result.total += ab.balance
        typeTotal += ab.balance
        if (pin[ab.id]) {
          result.pinned = result.pinned || {total: 0}
          result.pinned.total += ab.balance
          pinnedTypeTotal += ab.balance
          pinned = true
        }
      }
      set(result, `type.${type}`, typeTotal)
      if (pinned) {
        set(result, `pinned.type.${type}`, pinnedTypeTotal)
      }
    }
    return result
  }
)

export const getRecentActivity = createSelector(
  createStructuredSelector({
    invoices: getInvoices,
    transfers: getTransfers
  }),
  (
    state,
    {
      from = getStartOfMonth(
        addMonths(getCurrentDate(), -PREVIOUS_MONTHS_TO_BE_CACHED)
      )
    } = {}
  ) => from,
  (allCollections, from) => {
    const recentActivity = []
    if (!areAllCollectionsReady(allCollections)) {
      return recentActivity
    }
    from = new Date(from).getTime()
    for (const name of Object.keys(allCollections)) {
      const collection = allCollections[name]
      for (const id of Object.keys(collection)) {
        const doc = collection[id]
        const {createdAt = 0, updatedAt = 0, deletedAt = 0} = doc
        const lastChange = {
          type: CREATED,
          time: createdAt,
          collection: name,
          id,
          doc
        }
        if (
          updatedAt >
          lastChange.time +
            MIN_ELAPSED_TIME_FROM_CREATE_TO_REPORT_UPDATE
        ) {
          lastChange.type = UPDATED
          lastChange.time = updatedAt
        }
        if (deletedAt > lastChange.time) {
          lastChange.type = DELETED
          lastChange.time = deletedAt
        }
        if (lastChange.time >= from) {
          recentActivity.push(lastChange)
        }
      }
    }
    return sortBy(recentActivity, 'time')
      .reverse()
      .slice(0, RECENT_ACTIVITY_ITEMS)
  }
)
