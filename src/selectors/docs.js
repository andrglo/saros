import get from 'lodash/get'
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
  toDateString
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

// eslint-disable-next-line no-unused-vars
const log = debug('selectors:docs')

const PREVIOUS_MONTHS_TO_BE_CACHED = 3
const BUDGET_VALIDITY = PREVIOUS_MONTHS_TO_BE_CACHED

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

export const isCreditcardAccount = (account, accounts = {}) =>
  (accounts[account] || {}).type === 'creditcard'

export const getDocProp = (id, path, collection, defaultValue = '') =>
  get(collection[id], path) || defaultValue

export const getName = (id, collection) =>
  getDocProp(id, 'name', collection)

const concatDescription = (
  description,
  complement,
  separator = '. '
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
    for (const partition of transaction.partitions) {
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
  }
  description = concatDescription(description, transaction.notes)
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
  for (const id of Object.keys(invoices)) {
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
    payments.push({
      ...transaction,
      id: `${transaction.id}@${issueDate}`,
      billedFrom: transaction.id,
      type: 'bill',
      amount,
      status: 'draft',
      issueDate,
      payDate: billedDate,
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
    ...invoice,
    id,
    partitions: redistributeAmount(
      partitions,
      invoice.paidAmount || invoice.amount
    )
  })
  for (const parcel of parcels) {
    partitions = parcel.partitions || partitions
    addTransaction({
      ...invoice,
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

const isVariableExpense = budget =>
  !budget.dayOfMonth && !budget.dayOfWeek

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
    if (isVariableExpense(review)) {
      continue
    }
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
        f = () => [[endedAt, endedAt]]
    }
    const dueDates = f(startsAt, endsAt, {
      ...budget,
      holidays,
      account,
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
      if (account.type === 'creditcard') {
        if (review.installments) {
          invoice.installments = review.installments
        }
      }
      transactions = [
        ...transactions,
        ...expandInvoice(issueId, {
          ...collections,
          invoices: {
            [issueId]: invoice
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
    categories: getCategories,
    places: getPlaces
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

const getCurrencyRate = (currencyRates = {}, from, to) => {
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
  return rate
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

export const getTransactionsByDay = createSelector(
  createStructuredSelector({
    from: (state, {from} = {}) =>
      from === undefined ? getCurrentDate() : from,
    to: (state, {to} = {}) => to,
    filter: (state, {filter}) => filter,
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
      filter = () => true,
      invoicesTransactions,
      transfersTransactions,
      budgetsTransactions,
      ...currenciesConversionData
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
        if ((!from || date >= from) && date <= to) {
          return filter(transaction)
        }
        return false
      }),
      ['dueDate', 'createdAt']
    )
    const calendar = {}
    for (let transaction of transactions) {
      transaction = convertTransactionCurrency(
        transaction,
        currenciesConversionData
      )
      const date = transaction.dueDate
      calendar[date] = calendar[date] || []
      if (
        transaction.type === 'bill' &&
        transaction.status === 'draft' &&
        transaction.issuer
      ) {
        const draft = calendar[date].find(
          t => t.issuer === transaction.issuer
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
