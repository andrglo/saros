import {
  createSelector,
  createStructuredSelector,
  defaultMemoize as memoize
} from 'reselect'
import sumBy from 'lodash/sumBy'
import sortBy from 'lodash/sortBy'
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
  setMonthAndDayOfMonth,
  extractYear,
  setDayOfWeek,
  addWeeks,
  getMonthsUntil,
  getWeeksUntil
} from '../lib/date'
import {getHolidays, loadHolidays, isBusinessDay} from './atlas'

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
        convertRecordTimestamps(doc)
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
      type: 'ccardBill',
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

export const expandInvoice = (id, {invoices, holidays, accounts}) => {
  let transactions = []
  const {parcels = [], billedFrom, ...invoice} = invoices[id]

  const addTransaction = transaction => {
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
      dueDates.push(dueDate)
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
        dueDates.push(dueDate)
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
      dueDates.push(dueDate)
    }
    date = addWeeks(date, interval)
  }
  return dueDates
}

export const expandBudget = (
  id,
  from,
  to,
  {budget, holidays, accounts}
) => {
  let transactions = []
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
        f = () => [endedAt]
    }
    const dueDates = f(startsAt, endsAt, {
      ...budget,
      holidays,
      account,
      startedAt
    })
    for (const dueDate of dueDates) {
      const invoiceId = `${id}@${dueDate}`
      const amount = getTotal(review.partitions)
      const invoice = {
        flow: review.flow,
        place: review.place,
        notes: review.notes,
        partitions: review.partitions,
        issueDate: dueDate,
        dueDate,
        amount,
        account: review.account
      }
      if (account.type === 'creditcard') {
        invoice.type = 'ccard'
        invoice.payDate = invoice.issueDate
        if (review.installments) {
          invoice.installments = review.installments
        }
      }
      transactions = [
        ...transactions,
        ...expandInvoice(invoiceId, {
          invoices: {
            [invoiceId]: invoice
          },
          holidays,
          accounts
        })
      ]
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
    holidays: getHolidaysForAccounts,
    accounts: getAccounts
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
    let transactions = []
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
      transactions = [
        ...transactions,
        ...expandInvoice(id, {invoices, holidays, accounts})
      ]
    }
    return transactions
  }
)
