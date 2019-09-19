import get from 'lodash/get'
import uniq from 'lodash/uniq'
import sumBy from 'lodash/sumBy'
import sortBy from 'lodash/sortBy'
import round from 'lodash/round'
import debug from 'debug'

import {subscribeCollection} from '../controller'
import {getDb} from './app'
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
  getCurrentMonth
} from '../lib/date'
import {
  createSelector,
  createStructuredSelector,
  memoize
} from '../lib/reselect'
import {getHolidays, loadHolidays, isBusinessDay} from './atlas'
import t from '../lib/translate'

// eslint-disable-next-line no-unused-vars
const log = debug('selectors:docs')

const PREVIOUS_MONTHS_TO_BE_CACHED = 3

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
      const {id, doc, ...rest} = item
      if (id && doc) {
        const [invoiceId] = getIdAndParcelIndex(id)
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

export const getDocProp = (id, path, collection, defaultValue = '') =>
  get(collection[id], path) || defaultValue

export const getName = (id, collection) =>
  getDocProp(id, 'name', collection) ||
  getDocProp(id, 'description', collection) // todo remove-me

const concatDescription = (
  description,
  complement,
  separator = '; '
) =>
  `${description || ''}${
    description && complement ? separator : ''
  }${complement || ''}`

const buildTransactionDescription = (
  transaction,
  {categories, places}
) => {
  let description = transaction.description
  if (transaction.partitions) {
    let lastCategory = null
    const descriptions = []
    for (const partition of transaction.partitions) {
      const description =
        partition.description && partition.description.trim()
      if (description) {
        descriptions.push(description)
        lastCategory = partition.category
      } else if (partition.category !== lastCategory) {
        lastCategory = partition.category
        descriptions.push(getName(partition.category, categories))
      }
    }
    description = concatDescription(
      description,
      uniq(descriptions).join('; ')
    )
  }
  description = concatDescription(description, transaction.notes)
  if (transaction.place) {
    description = concatDescription(
      description,
      getName(transaction.place, places),
      ' ▪ ',
      ' •▪ '
    )
  }
  return description
}

export const getTotal = recordset =>
  round(sumBy(recordset, 'amount'), 2)

export const getInvoiceTotal = ({amount = 0, parcels = []}) =>
  getTotal([{amount}, ...parcels])

export const redistributeAmount = (partitions, newAmount) => {
  const total = getTotal(partitions)
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
  if (!Math.isZero(remainder) && result.length) {
    const lastIndex = result.length - 1
    result[lastIndex].amount = round(
      result[lastIndex].amount + remainder,
      2
    )
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
  const invoicesLastBill = {}
  for (const id of Object.keys(invoices)) {
    const invoice = invoices[id]
    for (const item of invoice.billedFrom || []) {
      if (item.id) {
        const lastBill = invoicesLastBill[item.id]
        if (!lastBill || lastBill.issueDate < invoice.issueDate) {
          invoicesLastBill[item.id] = item
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
  const {payDate, installments = 1} = transaction
  const account = accounts[transaction.account]
  const {bestDay, dueDay} = account

  let firstPayment

  const getIssueDate = month => {
    const lengthOfMonth = getLengthOfMonth(month)
    const dueDayInThisMonth =
      dueDay > lengthOfMonth ? lengthOfMonth : dueDay
    return setDayOfMonth(month, dueDayInThisMonth)
  }

  const getFirstPayment = () => {
    if (!firstPayment) {
      firstPayment = getIssueDate(payDate)
      if (firstPayment <= payDate) {
        firstPayment = getIssueDate(addMonths(firstPayment, 1))
      }
      let bestDate
      if (bestDay > dueDay) {
        bestDate = setDayOfMonth(addMonths(firstPayment, -1), bestDay)
      } else {
        bestDate = setDayOfMonth(firstPayment, bestDay)
      }
      if (payDate >= bestDate) {
        firstPayment = addMonths(firstPayment, 1)
      }
    }
    return firstPayment
  }

  const getInstallmentIssueDate = installment => {
    return getIssueDate(addMonths(getFirstPayment(), installment - 1))
  }

  const payAccount = accounts[transaction.payAccount] || account
  const getDueDate = issueDate => {
    let dueDate = issueDate
    while (!isBusinessDay(dueDate, payAccount, holidays)) {
      dueDate = addDays(dueDate, 1)
    }
    return dueDate
  }

  const lastBill = invoicesLastBill[transaction.id]
  let balance
  let installment
  const payments = []
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
        : round(
            Math.trunc((balance / remainingInstallments) * 100) / 100,
            2
          )
    installment++
    balance = round(balance - amount, 2)
    const issueDate = getInstallmentIssueDate(installment)
    payments.push({
      id: `${transaction.id}@${issueDate}`,
      billedFrom: transaction.id,
      type: 'bill',
      amount,
      status: 'draft',
      issueDate,
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

export const expandInvoice = (id, collections) => {
  let transactions = []
  const {invoices, holidays, accounts} = collections
  const {parcels = [], billedFrom, ...invoice} = invoices[id]

  const addTransaction = transaction => {
    transaction.description = buildTransactionDescription(
      transaction,
      collections
    )
    transactions.push(transaction)
    if (transaction.type === 'ccard') {
      transactions = [
        ...transactions,
        ...getRemainingPaymentsForCreditcard({
          transaction,
          accounts,
          holidays,
          invoicesLastBill: getInvoicesLastBill(invoices)
        })
      ]
    }
  }

  let partitions = invoice.partitions
  if (!partitions) {
    partitions = getPartitions(id, invoices)
  }
  addTransaction({
    ...invoice,
    id,
    partitions: redistributeAmount(
      partitions,
      invoice.paidAmount || invoice.amount
    )
  })
  for (const [parcelIndex, parcel] of parcels.entries()) {
    partitions = parcel.partitions || partitions
    addTransaction({
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

const getActualDueDate = (
  dueDate,
  {holidays, account, onlyInBusinessDays}
) => {
  if (!onlyInBusinessDays) {
    return dueDate
  }
  const interval = onlyInBusinessDays === 'previous' ? -1 : 1
  while (!isBusinessDay(dueDate, account, holidays)) {
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
    account,
    interval = 1,
    startedAt
  }
) => {
  const dueDates = []
  let date = from
  if (startedAt && interval > 1) {
    date = addMonths(date, getMonthsUntil(startedAt, date) % interval)
  }
  const scanUntil = addMonths(to, interval)
  while (date <= scanUntil) {
    date = setDayOfMonth(date, dayOfMonth)
    const dueDate = getActualDueDate(date, {
      onlyInBusinessDays,
      holidays,
      account
    })
    if (dueDate >= from && dueDate <= to) {
      dueDates.push([date, dueDate])
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
    account,
    interval = 1,
    startedAt
  }
) => {
  const dueDates = []
  let year = Number(extractYear(from))
  if (startedAt && interval > 1) {
    year += (year - Number(extractYear(startedAt))) % interval
  }
  const scanUntil = Number(extractYear(to)) + interval
  while (year <= scanUntil) {
    for (const month of months) {
      const date = setMonthAndDayOfMonth(year, month, dayOfMonth)
      const dueDate = getActualDueDate(date, {
        onlyInBusinessDays,
        holidays,
        account
      })
      if (dueDate >= from && dueDate <= to) {
        dueDates.push([date, dueDate])
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
    account,
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
      account
    })
    if (dueDate >= from && dueDate <= to) {
      dueDates.push([date, dueDate])
    }
    date = addWeeks(date, interval)
  }
  return dueDates
}

const getInvoicesByBudget = memoize(invoices => {
  const invoicesByBudget = new Set()
  for (const id of Object.keys(invoices || {})) {
    if (invoices[id].budget) {
      const invoice = invoices[id]
      invoicesByBudget.add(`${invoice.budget}@${invoice.issueDate}`)
    }
  }
  return invoicesByBudget
})

export const expandBudget = (id, from, to, collections) => {
  let transactions = []
  const {budget, holidays, accounts, invoices} = collections
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
    const account = accounts[review.account]
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
        f = () => [endedAt, endedAt]
    }
    const dueDates = f(startsAt, endsAt, {
      ...budget,
      holidays,
      account,
      startedAt
    })
    const invoicesByBudget = getInvoicesByBudget(invoices)
    for (const [date, dueDate] of dueDates) {
      const invoiceId = `${id}@${date}`
      if (invoicesByBudget.has(invoiceId)) {
        continue
      }
      const amount = getTotal(review.partitions)
      const invoice = {
        type: review.type,
        place: review.place,
        notes: review.notes,
        partitions: review.partitions,
        issueDate: date,
        dueDate,
        amount,
        account: review.account
      }
      if (account.type === 'creditcard') {
        invoice.type = 'ccard'
        invoice.payDate = invoice.dueDate
        if (review.installments) {
          invoice.installments = review.installments
        }
      }
      transactions = [
        ...transactions,
        ...expandInvoice(invoiceId, {
          ...collections,
          invoices: {
            [invoiceId]: invoice
          }
        })
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
        ...expandInvoice(id, {
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

const getFrom = (state, {from} = {}) => from || getCurrentDate()
const getTo = (state, {to} = {}) => to

export const getBudgetsTransactions = createSelector(
  createStructuredSelector({
    from: getFrom,
    to: getTo,
    invoices: getInvoices,
    budgets: getBudgets,
    holidays: getHolidaysForAccounts,
    accounts: getAccounts,
    categories: getCategories,
    places: getPlaces
  }),
  params => {
    let {
      from,
      to,
      holidays,
      invoices,
      budgets,
      accounts,
      categories,
      places
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
    to = to && to >= from ? to : from
    for (const id of Object.keys(budgets)) {
      transactions = [
        ...transactions,
        ...expandBudget(id, from, to, {
          budget: budgets[id],
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

export const getTransactionsByDay = createSelector(
  createStructuredSelector({
    from: getFrom,
    to: getTo,
    invoicesTransactions: getInvoicesTransactions,
    transfersTransactions: getTransfersTransactions,
    budgetsTransactions: getBudgetsTransactions,
    invoices: getInvoices,
    budgets: getBudgets,
    holidays: getHolidaysForAccounts,
    accounts: getAccounts
  }),
  params => {
    const {
      from,
      to,
      invoicesTransactions,
      transfersTransactions,
      budgetsTransactions
    } = params
    const transactions = sortBy(
      [
        ...invoicesTransactions,
        ...transfersTransactions,
        ...budgetsTransactions
      ].filter(transaction => {
        const date = transaction.dueDate
        if (!date) {
          throw new Error(
            `Transaction has no due date: ${JSON.stringify(
              transaction
            )}`
          )
        }
        return date >= from && date <= to
      }),
      ['dueDate', 'createdAt']
    )
    const calendar = {}
    for (const transaction of transactions) {
      const date = transaction.dueDate
      calendar[date] = calendar[date] || []
      calendar[date].push(transaction)
    }
    log('getTransactionsByDay result', calendar)
    return calendar
  }
)
