import test from 'ava'
import mockery from 'mockery'
import noop from 'lodash/noop'
import sumBy from 'lodash/sumBy'
import map from 'lodash/fp/map'

// eslint-disable-next-line no-unused-vars
import util from 'util'

import currencies from '../../assets/atlas/currencies.json'
import loadDb from '../../../test/data/loadDb'
import completion from '../../../test/lib/completion'
import sleep from '../../../test/lib/sleep'
import '../../lib/polyfill'

const db = 'solar'

const currencyRates = {
  base: 'EUR',
  rates: {
    BRL: 4.539491,
    EUR: 1,
    USD: 1.094223
  }
}

const holidays = {
  BR: {
    '01-01': {name: 'Confraternização Universal'},
    '04-21': {name: 'Tiradentes'},
    '09-07': {name: 'Independência'},
    '10-12': {name: 'Nossa Senhora Aparecida'},
    '11-02': {name: 'Finados'},
    '11-15': {name: 'Proclamação da república'},
    '12-25': {name: 'Natal'},
    '12-31': {name: 'Feriado bancário'},
    'easter-48': {name: 'Carnaval'},
    'easter-47': {name: 'Carnaval'},
    'easter-2': {name: 'Sexta-feira Santa'},
    'easter+60': {name: 'Corpus Christi'}
  },
  'BR/MG/Belo Horizonte': {
    '08-15': {name: 'Assunção de Nossa Senhora'},
    '12-08': {name: 'Imaculada Conceição'}
  },
  'BR/SP/Not listed': {},
  'BR/MG/Betim': {'07-16': {name: ''}, '11-20': {name: ''}}
}

const state = {
  app: {
    db
  },
  atlas: {},
  docs: loadDb(db)
}

const controller = {
  subscribeCollection: noop,
  convertRecordTimestamps: record => {
    if (record.updatedAt) {
      record.updatedAt = new Date(record.updatedAt).getTime()
    }
    if (record.createdAt) {
      record.createdAt = new Date(record.createdAt).getTime()
    }
  },
  getStore: () => ({
    dispatch: noop
  })
}

const mapTransactionsDueDates = map('dueDate')
const mapDueDates = map('1')
const removeDescriptions = map(transaction => {
  const {description, ...rest} = transaction
  return rest
})

test.before(async t => {
  mockery.enable({warnOnUnregistered: false})
  mockery.registerMock('../controller', controller)
  const selectors = await import('../docs')
  Object.keys(selectors).forEach(p => {
    t.context[p] = selectors[p]
  })
  const {getInvoices, invoiceTransform} = selectors
  const invoices = getInvoices(state)
  for (const id of Object.keys(invoices)) {
    invoiceTransform(invoices, id, invoices[id])
  }
})

test.after(() => {
  mockery.deregisterAll()
})

test.serial('Check model', t => {
  const {getAllCollections} = t.context
  const allCollections = getAllCollections(state)
  t.is(Object.keys(allCollections).length, 7)
  const {invoices} = allCollections
  Object.keys(invoices).forEach(id => {
    t.is(
      typeof invoices[id].createdAt,
      'number',
      'invoiceTransform did not convert createdAt'
    )
    t.is(
      typeof invoices[id].updatedAt,
      'number',
      'invoiceTransform did not convert updatedAt'
    )
  })
})

test('Redistribute amount', t => {
  const {redistributeAmount} = t.context
  const list = redistributeAmount(
    [
      {
        amount: 100
      },
      {
        amount: 200
      },
      {
        amount: 300
      }
    ],
    1000
  )
  t.deepEqual(list, [
    {
      amount: 167
    },
    {
      amount: 333
    },
    {
      amount: 500
    }
  ])
})

test('Get partitions', t => {
  const {getPartitions} = t.context
  const list = getPartitions('9', {
    '1': {
      amount: 1000,
      partitions: [
        {
          category: 'X',
          amount: 200
        },
        {
          category: 'Y',
          amount: 800
        }
      ]
    },
    '2': {
      amount: 400,
      parcels: [
        {
          amount: 600,
          partitions: [
            {
              category: 'A',
              amount: 100
            },
            {
              category: 'C',
              amount: 500
            }
          ]
        }
      ],
      partitions: [
        {
          category: 'A',
          amount: 200
        },
        {
          category: 'B',
          amount: 800
        }
      ]
    },
    '4': {
      amount: 200,
      billedFrom: [
        {
          id: '2',
          amount: 100
        }
      ]
    },
    '9': {
      billedFrom: [
        {
          id: '1',
          amount: 400,
          description: 'first'
        },
        {
          id: '2/1',
          amount: 300,
          description: 'second'
        },
        {
          id: '4',
          amount: 50,
          description: 'third'
        }
      ]
    }
  })
  // console.log('TCL: list', list)
  t.deepEqual(list, [
    {category: 'X', amount: 80},
    {category: 'Y', amount: 320},
    {category: 'A', amount: 50},
    {category: 'C', amount: 250},
    {category: 'A', amount: 10},
    {category: 'B', amount: 40}
  ])
})

test.serial('Get holidays for accounts', async t => {
  const {getHolidaysForAccounts} = t.context
  const actions = []
  const getStore = controller.getStore
  controller.getStore = () => ({
    dispatch: action => {
      actions.push(action)
    }
  })
  let holidaysForAccounts = getHolidaysForAccounts(state)
  getHolidaysForAccounts(state) // again
  getHolidaysForAccounts(state) // again
  getHolidaysForAccounts(state) // again
  getHolidaysForAccounts(state) // and again
  t.is(holidaysForAccounts, undefined)
  holidaysForAccounts = await completion(() => {
    if (actions.length > 0) {
      return actions[0].holidays
    }
  })
  // console.log('TCL: result', util.inspect(requiredHolidays, {depth: null}))
  t.deepEqual(holidaysForAccounts, holidays)
  await sleep(100)
  t.is(actions.length, 1)
  controller.getStore = getStore
})

test('Get invoices last bill', t => {
  const {getInvoicesLastBill, getInvoices} = t.context
  const invoicesLastBill = getInvoicesLastBill(getInvoices(state))
  t.is(
    invoicesLastBill.issuers['-ssZsPnhWoo'].issueDate,
    '2019-01-18'
  )
  t.deepEqual(invoicesLastBill.invoices, {
    ai8H2bFxt4jv: {id: 'ai8H2bFxt4jv', amount: -1690},
    '6zzwHBvMRmmm': {
      id: '6zzwHBvMRmmm',
      installment: 1,
      amount: -23252,
      balance: -23252
    },
    XrE2xUBgkjPj: {id: 'XrE2xUBgkjPj', amount: -56300},
    tjuWBgnG42Rd: {id: 'tjuWBgnG42Rd', amount: -8970}
  })
})

test('Get invoices last bill after more than 1 payment', t => {
  const {getInvoicesLastBill} = t.context
  const invoicesLastBill = getInvoicesLastBill({
    sed1: {
      issuer: 'vis',
      issueDate: '2019-01-05',
      billedFrom: [
        {
          id: 'a',
          installment: 1
        }
      ]
    },
    sed2: {
      issuer: 'vis',
      issueDate: '2019-02-05',
      billedFrom: [
        {
          id: 'a',
          installment: 2
        }
      ]
    }
  })
  t.deepEqual(invoicesLastBill.issuers.vis.issueDate, '2019-02-05')
  t.deepEqual(invoicesLastBill.invoices, {
    a: {id: 'a', installment: 2}
  })
})

test('Get remaining payments for credit cards', t => {
  const {
    getRemainingPaymentsForCreditcard,
    getInvoicesLastBill,
    getInvoices
  } = t.context
  const invoicesLastBill = getInvoicesLastBill(getInvoices(state))
  const accounts = {
    '1': {
      dueDay: 8,
      bestDay: 31,
      country: 'BR',
      state: 'MG',
      city: 'Belo Horizonte'
    }
  }

  const total = 33333
  let remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      issueDate: '2019-08-30',
      installments: 16,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })
  // console.log(
  //   'TCL: remainingPayments',
  //   util.inspect(remainingPayments, {depth: null})
  // )
  t.deepEqual(
    remainingPayments.map(
      (
        {
          installment,
          balance,
          amount,
          status,
          account,
          partitions,
          dueDate
        },
        i
      ) => {
        t.is(partitions.length, 1)
        t.is(amount, partitions[0].amount)
        t.is(status, 'draft')
        t.is(account, '1')
        t.is(installment, i + 1)
        if (installment === 16) {
          t.is(balance, 0)
        }
        let remainingAmount = balance
        for (let k = i + 1; k < remainingPayments.length; k++) {
          remainingAmount -= remainingPayments[k].amount
        }
        t.is(remainingAmount, 0)
        return dueDate
      }
    ),
    [
      '2019-09-09',
      '2019-10-08',
      '2019-11-08',
      '2019-12-09',
      '2020-01-08',
      '2020-02-10',
      '2020-03-09',
      '2020-04-08',
      '2020-05-08',
      '2020-06-08',
      '2020-07-08',
      '2020-08-10',
      '2020-09-08',
      '2020-10-08',
      '2020-11-09',
      '2020-12-09'
    ]
  )
  t.deepEqual(remainingPayments.map(({issueDate}) => issueDate), [
    '2019-09-08',
    '2019-10-08',
    '2019-11-08',
    '2019-12-08',
    '2020-01-08',
    '2020-02-08',
    '2020-03-08',
    '2020-04-08',
    '2020-05-08',
    '2020-06-08',
    '2020-07-08',
    '2020-08-08',
    '2020-09-08',
    '2020-10-08',
    '2020-11-08',
    '2020-12-08'
  ])
  t.is(sumBy(remainingPayments, 'amount'), total)

  accounts['1'] = {
    bestDay: 10,
    dueDay: 20,
    country: 'BR',
    state: 'MG',
    city: 'Betim'
  }
  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      issueDate: '2018-11-09',
      installments: 8,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })

  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2018-11-21',
    '2018-12-20',
    '2019-01-21',
    '2019-02-20',
    '2019-03-20',
    '2019-04-22',
    '2019-05-20',
    '2019-06-21'
  ])

  accounts['1'] = {
    bestDay: 21,
    dueDay: 31,
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      issueDate: '2019-01-20',
      installments: 3,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })

  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2019-01-31',
    '2019-02-28',
    '2019-04-01'
  ])

  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      issueDate: '2019-01-21',
      installments: 3,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })
  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2019-02-28',
    '2019-04-01',
    '2019-04-30'
  ])

  accounts['1'] = {
    bestDay: 31,
    dueDay: 8,
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      issueDate: '2018-12-30',
      installments: 3,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })
  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2019-01-08',
    '2019-02-08',
    '2019-03-08'
  ])
  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      payDate: '2018-12-31',
      installments: 3,
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })
  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2019-02-08',
    '2019-03-08',
    '2019-04-08'
  ])

  accounts['1'] = {
    bestDay: 25,
    dueDay: 8,
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      payDate: '2019-01-31',
      account: '1',
      partitions: [
        {
          amount: total
        }
      ]
    },
    accounts,
    holidays,
    invoicesLastBill
  })
  t.deepEqual(mapTransactionsDueDates(remainingPayments), [
    '2019-03-08'
  ])
})

test('Expand invoice', t => {
  const {
    expandInvoice,
    getAccounts,
    getCategories,
    getPlaces
  } = t.context
  const invoices = {
    '1': {
      amount: 1000,
      partitions: [
        {
          category: 'X',
          description: 'category X',
          amount: 200
        },
        {
          category: 'Y',
          amount: 800
        }
      ]
    },
    '2': {
      amount: 400,
      parcels: [
        {
          amount: 600,
          partitions: [
            {
              category: 'A',
              amount: 100
            },
            {
              category: 'C',
              amount: 500
            }
          ]
        }
      ],
      partitions: [
        {
          category: 'A',
          amount: 200
        },
        {
          category: 'B',
          amount: 800
        }
      ]
    },
    '3': {
      type: 'pyb',
      installments: 3,
      amount: 10000,
      issueDate: '2019-07-10',
      partitions: [
        {
          category: 'X',
          amount: 10000
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '4': {
      amount: 100,
      billedFrom: [
        {
          id: '2',
          amount: 100
        }
      ]
    },
    '5': {
      type: 'pyb',
      installments: 10,
      amount: 9900,
      issueDate: '2018-07-10',
      partitions: [
        {
          category: 'X',
          amount: 9900
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '6': {
      type: 'pyb',
      installments: 10,
      amount: 9900,
      issueDate: '2018-07-10',
      partitions: [
        {
          category: 'X',
          amount: 9900
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '7': {
      issuer: '-ssZsPnhWoo',
      billedFrom: [
        {
          id: '6',
          amount: 990,
          installment: 10,
          balance: 1000
        }
      ],
      amount: 990
    },
    '8': {
      issuer: '-ssZsPnhWoo',
      billedFrom: [
        {
          id: '5',
          amount: 990,
          installment: 8,
          balance: 1000
        }
      ],
      amount: 990
    },
    '9': {
      billedFrom: [
        {
          id: '1',
          amount: 400
        },
        {
          id: '2/1',
          amount: 300
        },
        {
          id: '4',
          amount: 50
        },
        {
          amount: 87,
          description: 'dif',
          partitions: [
            {
              category: 'D',
              amount: 87
            }
          ]
        },
        {
          amount: 3,
          description: 'extra dif'
        }
      ],
      amount: 400,
      parcels: [
        {
          amount: 430
        }
      ]
    }
  }
  let list = expandInvoice('9', {
    invoices,
    categories: {},
    places: {}
  })
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  // .38+1.52+.24+1.19+.05+.19+.41+.02=4
  // .41+1.64+.26+1.28+.05+.2+.45+.01=4.3
  t.deepEqual(removeDescriptions(list), [
    {
      amount: 400,
      id: '9',
      installment: 1,
      installments: 2,
      partitions: [
        {category: 'X', description: 'category X', amount: 38},
        {category: 'Y', amount: 152},
        {category: 'A', amount: 24},
        {category: 'C', amount: 119},
        {category: 'A', amount: 5},
        {category: 'B', amount: 19},
        {
          amount: 41,
          description: 'dif',
          category: 'D'
        },
        {amount: 2, description: 'extra dif'}
      ]
    },
    {
      amount: 430,
      id: '9/1',
      installment: 2,
      installments: 2,
      partitions: [
        {category: 'X', description: 'category X', amount: 41},
        {category: 'Y', amount: 164},
        {category: 'A', amount: 26},
        {category: 'C', amount: 128},
        {category: 'A', amount: 5},
        {category: 'B', amount: 20},
        {
          amount: 45,
          description: 'dif',
          category: 'D'
        },
        {amount: 1, description: 'extra dif'}
      ]
    }
  ])
  list = expandInvoice('4', {invoices, categories: {}, places: {}})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      amount: 100,
      id: '4',
      partitions: [
        {category: 'A', amount: 20},
        {category: 'B', amount: 80}
      ]
    }
  ])
  list = expandInvoice('2', {invoices, categories: {}, places: {}})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      partitions: [
        {category: 'A', amount: 80},
        {category: 'B', amount: 320}
      ],
      amount: 400,
      installment: 1,
      installments: 2,
      id: '2'
    },
    {
      partitions: [
        {category: 'A', amount: 100},
        {category: 'C', amount: 500}
      ],
      amount: 600,
      installment: 2,
      installments: 2,
      id: '2/1'
    }
  ])
  list = expandInvoice('1', {invoices, categories: {}, places: {}})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      partitions: [
        {category: 'X', amount: 200, description: 'category X'},
        {category: 'Y', amount: 800}
      ],
      amount: 1000,
      id: '1'
    }
  ])

  const accounts = getAccounts(state)
  const categories = getCategories(state)
  const places = getPlaces(state)
  list = expandInvoice('3', {
    invoices,
    holidays,
    accounts,
    categories,
    places
  })
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      type: 'pyb',
      installments: 3,
      partitions: [{category: 'X', amount: 10000}],
      account: '-ssZsPnhWoo',
      amount: 10000,
      issueDate: '2019-07-10',
      id: '3'
    },
    {
      id: '3@2019-07-31',
      billedFrom: '3',
      type: 'bill',
      amount: 3333,
      status: 'draft',
      issueDate: '2019-07-31',
      dueDate: '2019-07-31',
      account: 'AHIhOdX7cxo',
      issuer: '-ssZsPnhWoo',
      billedDate: '2019-07-10',
      partitions: [{category: 'X', amount: 3333}],
      installment: 1,
      installments: 3,
      balance: 6667
    },
    {
      id: '3@2019-08-31',
      billedFrom: '3',
      type: 'bill',
      amount: 3333,
      status: 'draft',
      issueDate: '2019-08-31',
      dueDate: '2019-09-02',
      account: 'AHIhOdX7cxo',
      issuer: '-ssZsPnhWoo',
      billedDate: '2019-07-10',
      partitions: [{category: 'X', amount: 3333}],
      installment: 2,
      installments: 3,
      balance: 3334
    },
    {
      id: '3@2019-09-30',
      billedFrom: '3',
      type: 'bill',
      amount: 3334,
      status: 'draft',
      issueDate: '2019-09-30',
      dueDate: '2019-09-30',
      account: 'AHIhOdX7cxo',
      issuer: '-ssZsPnhWoo',
      billedDate: '2019-07-10',
      partitions: [{category: 'X', amount: 3334}],
      installment: 3,
      installments: 3,
      balance: 0
    }
  ])

  list = expandInvoice('5', {
    invoices,
    holidays,
    accounts,
    categories,
    places
  })
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      type: 'pyb',
      installments: 10,
      partitions: [{category: 'X', amount: 9900}],
      account: '-ssZsPnhWoo',
      amount: 9900,
      issueDate: '2018-07-10',
      id: '5'
    },
    {
      id: '5@2019-03-31',
      billedFrom: '5',
      type: 'bill',
      amount: 500,
      status: 'draft',
      issueDate: '2019-03-31',
      dueDate: '2019-04-01',
      account: 'AHIhOdX7cxo',
      issuer: '-ssZsPnhWoo',
      billedDate: '2018-07-10',
      partitions: [{category: 'X', amount: 500}],
      installment: 9,
      installments: 10,
      balance: 500
    },
    {
      id: '5@2019-04-30',
      billedFrom: '5',
      type: 'bill',
      amount: 500,
      status: 'draft',
      issueDate: '2019-04-30',
      dueDate: '2019-04-30',
      account: 'AHIhOdX7cxo',
      issuer: '-ssZsPnhWoo',
      billedDate: '2018-07-10',
      partitions: [{category: 'X', amount: 500}],
      installment: 10,
      installments: 10,
      balance: 0
    }
  ])

  list = expandInvoice('6', {
    invoices,
    holidays,
    accounts,
    categories,
    places
  })
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(removeDescriptions(list), [
    {
      type: 'pyb',
      installments: 10,
      partitions: [{category: 'X', amount: 9900}],
      account: '-ssZsPnhWoo',
      amount: 9900,
      issueDate: '2018-07-10',
      id: '6'
    }
  ])
})

test('Get monthly due dates', t => {
  const {getMonthlyDueDates} = t.context
  const region = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getMonthlyDueDates('2019-01-31', '2019-12-31', {
    dayOfMonth: 31,
    onlyInBusinessDays: 'previous',
    holidays,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, [
    ['2019-01-31', '2019-01-31'],
    ['2019-02-28', '2019-02-28'],
    ['2019-03-31', '2019-03-29'],
    ['2019-04-30', '2019-04-30'],
    ['2019-05-31', '2019-05-31'],
    ['2019-06-30', '2019-06-28'],
    ['2019-07-31', '2019-07-31'],
    ['2019-08-31', '2019-08-30'],
    ['2019-09-30', '2019-09-30'],
    ['2019-10-31', '2019-10-31'],
    ['2019-11-30', '2019-11-29'],
    ['2019-12-31', '2019-12-30']
  ])

  dueDates = getMonthlyDueDates('2019-09-02', '2019-10-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'next',
    holidays,
    region
  })
  t.deepEqual(mapDueDates(dueDates), ['2019-09-02', '2019-10-01'])

  dueDates = getMonthlyDueDates('2019-10-01', '2019-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    startedAt: '2019-10-01',
    interval: 3,
    region
  })
  t.deepEqual(mapDueDates(dueDates), ['2019-10-01', '2019-12-30'])

  dueDates = getMonthlyDueDates('2020-01-02', '2020-03-31', {
    dayOfMonth: 31,
    onlyInBusinessDays: 'next',
    holidays,
    startedAt: '2019-01-02',
    interval: 2,
    region
  })
  t.deepEqual(mapDueDates(dueDates), ['2020-01-31', '2020-03-31'])
})

test('Get yearly due dates', t => {
  const {getYearlyDueDates} = t.context
  const region = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getYearlyDueDates('2019-01-31', '2019-12-31', {
    dayOfMonth: 31,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    onlyInBusinessDays: 'previous',
    holidays,
    region
  })
  t.deepEqual(mapDueDates(dueDates), [
    '2019-01-31',
    '2019-02-28',
    '2019-03-29',
    '2019-04-30',
    '2019-05-31',
    '2019-06-28',
    '2019-07-31',
    '2019-08-30',
    '2019-09-30',
    '2019-10-31',
    '2019-11-29',
    '2019-12-30'
  ])

  dueDates = getYearlyDueDates('2019-09-02', '2019-10-31', {
    dayOfMonth: 1,
    months: [9, 10],
    onlyInBusinessDays: 'next',
    holidays,
    region
  })
  t.deepEqual(mapDueDates(dueDates), ['2019-09-02', '2019-10-01'])

  dueDates = getYearlyDueDates('2019-10-01', '2019-12-31', {
    dayOfMonth: 1,
    months: [12],
    onlyInBusinessDays: 'previous',
    holidays,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-11-29'])

  dueDates = getYearlyDueDates('2019-10-01', '2021-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    months: ['1', '10'],
    startedAt: '2019-10-01',
    interval: 3,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-10-01', '2021-12-30'])
  dueDates = getYearlyDueDates('2019-10-01', '2021-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    months: ['1', '10'],
    startedAt: '1989-10-01',
    interval: 3,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-10-01', '2021-12-30'])
})

test('Get weekly due dates', t => {
  const {getWeeklyDueDates} = t.context
  const region = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getWeeklyDueDates('2019-02-24', '2019-03-31', {
    dayOfWeek: 1,
    onlyInBusinessDays: 'next',
    interval: 2,
    holidays,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-03-06', '2019-03-18'])

  dueDates = getWeeklyDueDates('2019-11-20', '2019-12-30', {
    dayOfWeek: 2,
    onlyInBusinessDays: 'previous',
    startedAt: '2019-11-20',
    interval: 3,
    holidays,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-12-10', '2019-12-30'])

  dueDates = getWeeklyDueDates('2019-02-24', '2019-03-31', {
    dayOfWeek: 1,
    onlyInBusinessDays: 'next',
    startedAt: '2018-12-30',
    interval: 2,
    holidays,
    region
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(mapDueDates(dueDates), ['2019-03-06', '2019-03-18'])
})

test('Expand budget', t => {
  const {expandBudget} = t.context
  const accounts = {
    '1': {
      country: 'BR',
      state: 'MG',
      city: 'Belo Horizonte'
    },
    '2': {
      type: 'creditcard',
      country: 'BR',
      state: 'MG',
      city: 'Belo Horizonte',
      dueDay: 8,
      bestDay: 25,
      payAccount: '1'
    }
  }
  const budget = {
    currency: 'USD',
    partitions: [
      {
        costCenter: 'A',
        category: 'a',
        description: 'Mine',
        amount: -20340
      },
      {
        costCenter: 'B',
        category: 'b',
        description: 'My son',
        amount: -10542
      }
    ],
    type: 'pbud',
    place: 'vxbJp9WfTu0',
    account: '1',
    frequency: 'monthly',
    dayOfMonth: 10,
    onlyInBusinessDays: 'previous',
    date: '2019-01-10',
    notes: 'Health plan'
  }
  let transactions = expandBudget('b', '2019-02-24', '2019-04-30', {
    budget,
    holidays,
    accounts,
    categories: {},
    places: {},
    invoices: {
      ehv: {
        budget: 'b',
        issueDate: '2019-04-10'
      }
    }
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(removeDescriptions(transactions), [
    {
      type: 'pbud',
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      status: 'due',
      currency: 'USD',
      partitions: [
        {
          costCenter: 'A',
          category: 'a',
          description: 'Mine',
          amount: -20340
        },
        {
          costCenter: 'B',
          category: 'b',
          description: 'My son',
          amount: -10542
        }
      ],
      issueDate: '2019-03-10',
      dueDate: '2019-03-08',
      amount: -30882,
      account: '1',
      id: 'b@2019-03-10'
    }
  ])

  budget.reviews = [
    {
      date: '2019-02-10',
      installments: 2,
      account: '2'
    }
  ]
  transactions = expandBudget('b', '2019-02-24', '2019-03-31', {
    budget,
    holidays,
    categories: {},
    places: {},
    accounts
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(removeDescriptions(transactions), [
    {
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      currency: 'USD',
      partitions: [
        {
          costCenter: 'A',
          category: 'a',
          description: 'Mine',
          amount: -20340
        },
        {
          costCenter: 'B',
          category: 'b',
          description: 'My son',
          amount: -10542
        }
      ],
      issueDate: '2019-03-10',
      type: 'pbud',
      installments: 2,
      status: 'due',
      dueDate: '2019-03-08',
      amount: -30882,
      account: '2',
      id: 'b@2019-03-10'
    },
    {
      id: 'b@2019-03-10@2019-04-08',
      billedFrom: 'b@2019-03-10',
      type: 'bill',
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      billedDate: '2019-03-08',
      amount: -15441,
      status: 'draft',
      issueDate: '2019-04-08',
      dueDate: '2019-04-08',
      issuer: '2',
      account: '1',
      currency: 'USD',
      partitions: [
        {
          costCenter: 'A',
          category: 'a',
          description: 'Mine',
          amount: -10170
        },
        {
          costCenter: 'B',
          category: 'b',
          description: 'My son',
          amount: -5271
        }
      ],
      installment: 1,
      installments: 2,
      balance: -15441
    },
    {
      id: 'b@2019-03-10@2019-05-08',
      billedFrom: 'b@2019-03-10',
      type: 'bill',
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      billedDate: '2019-03-08',
      amount: -15441,
      status: 'draft',
      issueDate: '2019-05-08',
      dueDate: '2019-05-08',
      issuer: '2',
      account: '1',
      currency: 'USD',
      partitions: [
        {
          costCenter: 'A',
          category: 'a',
          description: 'Mine',
          amount: -10170
        },
        {
          costCenter: 'B',
          category: 'b',
          description: 'My son',
          amount: -5271
        }
      ],
      installment: 2,
      installments: 2,
      balance: 0
    }
  ])

  const allBudgetsTransactions = expandBudget(
    'b',
    '2000-01-01',
    '2019-12-31',
    {
      budget,
      holidays,
      categories: {},
      places: {},
      accounts
    }
  )
  transactions = expandBudget('b', null, '2019-12-31', {
    budget,
    holidays,
    categories: {},
    places: {},
    accounts
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(
    allBudgetsTransactions,
    transactions,
    'Error expanding budget since validity'
  )

  transactions = expandBudget('b', null, '2019-12-31', {
    budget: {
      partitions: [
        {
          costCenter: '93',
          category: '197',
          amount: 3599
        }
      ],
      endedAt: '2017-09-08',
      type: 'rbud',
      place: '11',
      account: '1',
      frequency: 'unique',
      dayOfMonth: 8,
      onlyInBusinessDays: 'next',
      date: '2017-09-08'
    },
    holidays,
    categories: {},
    places: {},
    accounts
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(
    transactions,
    [
      {
        type: 'rbud',
        place: '11',
        notes: undefined,
        status: 'due',
        currency: undefined,
        partitions: [
          {costCenter: '93', category: '197', amount: 3599}
        ],
        issueDate: '2017-09-08',
        dueDate: '2017-09-08',
        amount: 3599,
        account: '1',
        id: 'b@2017-09-08',
        description: ''
      }
    ],
    'Error expanding single due date budget'
  )
})

test('Get transfers transactions', t => {
  const localState = {...state, atlas: {holidays}}
  const {getTransfersTransactions} = t.context
  const transactions = getTransfersTransactions(localState)
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(removeDescriptions(transactions), [
    {
      id: 'lGzJl4KiYINF',
      type: 'balance-in',
      createdAt: 1565005449218,
      dueDate: '2019-08-05',
      account: 'AHIhOdX7cxo',
      amount: 330
    },
    {
      id: 'gZxGMyv47-np',
      type: 'transfer',
      createdAt: 1565111084553,
      dueDate: '2019-08-06',
      account: 'CYbteYpzdA6',
      amount: -90000,
      counterpart: 'AHIhOdX7cxo'
    },
    {
      id: '9YXiZnWpqf8k',
      type: 'transfer',
      createdAt: 1566818367284,
      dueDate: '2019-08-23',
      account: 'CYbteYpzdA6',
      amount: -5000,
      counterpart: 'AHIhOdX7cxo'
    },
    {
      id: 'HqoeVnU7yapt',
      type: 'transfer',
      createdAt: 1566818794912,
      dueDate: '2019-08-23',
      account: 'AHIhOdX7cxo',
      amount: -36600,
      counterpart: 'CYbteYpzdA6'
    }
  ])
})

test('Get budgets transactions', t => {
  const localState = {...state, atlas: {holidays}}
  const {getBudgetsTransactions} = t.context
  const transactions = getBudgetsTransactions(localState, {
    from: '2019-01-10',
    to: '2019-01-20'
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(removeDescriptions(transactions), [
    {
      type: 'pbud',
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      status: 'due',
      currency: undefined,
      partitions: [
        {
          costCenter: 'eBhqeuMtrBu',
          category: 'i7vJFZCrp1k',
          description: 'Mine',
          amount: -20340
        },
        {
          costCenter: 'BXE9vs32ZBA',
          category: 'i7vJFZCrp1k',
          description: 'My son',
          amount: -10542
        }
      ],
      issueDate: '2019-01-10',
      dueDate: '2019-01-10',
      amount: -30882,
      account: 'CYbteYpzdA6',
      id: 'hDnW3lo-cTTg@2019-01-10'
    }
  ])
})

test('Get transactions by day', t => {
  const localState = {...state, atlas: {holidays}}
  const {getTransactionsByDay} = t.context
  const calendar = getTransactionsByDay(localState, {
    from: '2019-01-10',
    to: '2019-01-20'
  })
  // console.log('TCL: calendar', util.inspect(calendar, {depth: null}))
  const dates = Object.keys(calendar)
  t.is(dates.length, 3)
  t.deepEqual(dates, ['2019-01-10', '2019-01-14', '2019-01-18'])
  t.deepEqual(
    dates.map(date => {
      t.is(calendar[date].length, 1)
      return calendar[date][0].amount
    }),
    [-30882, 3, -284973]
  )
})

test('Get invoices by budget check budget issueDate and budget dueDate to match invoice issueDate', t => {
  const {getInvoicesByBudget, getBudgetsTransactions} = t.context
  const invoices = {
    asd: {
      budget: 'f70e6',
      issueDate: '2019-09-23'
    }
  }
  const invoicesByBudget = getInvoicesByBudget(invoices)
  t.deepEqual([...invoicesByBudget], ['f70e6@2019-09-23'])
  const transactions = getBudgetsTransactions(
    {
      ...state,
      atlas: {holidays},
      docs: {
        ...state.docs,
        [`dbs/${state.app.db}/invoices`]: {data: invoices},
        [`dbs/${state.app.db}/budgets`]: {
          data: {
            f70e6: {
              partitions: [
                {
                  amount: 100
                }
              ],
              account: 'CYbteYpzdA6',
              frequency: 'monthly',
              dayOfMonth: 22,
              onlyInBusinessDays: 'next',
              date: '2017-04-18'
            }
          }
        }
      }
    },
    {
      from: '2019-09-01',
      to: '2019-09-30'
    }
  )
  t.deepEqual(transactions, [])
})

test('Get variable cost transactions', t => {
  const {getVariableCostTransactions} = t.context
  let transactions = getVariableCostTransactions(
    {
      ...state,
      atlas: {holidays},
      docs: {
        ...state.docs,
        [`dbs/${state.app.db}/budgets`]: {
          data: {
            f70e6: {
              type: 'mbud',
              partitions: [
                {
                  amount: 100,
                  category: 'Xo3z0jNPJvQ',
                  costCenter: 'eBhqeuMtrBu'
                }
              ],
              frequency: 'monthly',
              date: '2017-04-18'
            },
            f70e7: {
              type: 'mbud',
              partitions: [
                {
                  amount: -608,
                  category: 'c8H31KdYqn8',
                  costCenter: 'd4hS3Qb9E5O'
                }
              ],
              frequency: 'monthly',
              date: '2017-04-18'
            },
            f70e8: {
              type: 'mbud',
              partitions: [
                {
                  amount: -20000,
                  category: 'FUv4lDrdTYL',
                  costCenter: 'd4hS3Qb9E5O'
                }
              ],
              frequency: 'monthly',
              date: '2017-04-18'
            },
            ae6d3: {
              type: 'mbud',
              frequency: 'monthly',
              endedAt: '2018-04-13',
              partitions: [
                {
                  category: 'a8d1b',
                  amount: -5000
                }
              ],
              date: '2017-10-10'
            }
          }
        }
      }
    },
    {
      from: '2019-01-01',
      to: '2019-01-30'
    }
  )
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  transactions = transactions.map(t => ({
    id: t.id,
    month: t.month,
    forecast: t.forecast,
    amount: t.amount,
    partitionsLength: t.partitions.length
  }))
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(transactions, [
    {
      id: 'f70e6@2019-01:Xo3z0jNPJvQ',
      month: '2019-01',
      forecast: 100,
      amount: 3,
      partitionsLength: 1
    },
    {
      id: 'f70e7@2019-01:c8H31KdYqn8',
      month: '2019-01',
      forecast: -608,
      amount: -23252,
      partitionsLength: 1
    },
    {
      id: 'f70e8@2019-01:FUv4lDrdTYL',
      month: '2019-01',
      forecast: -20000,
      amount: -8970,
      partitionsLength: 1
    },
    {
      id: '2019-01:InYNor0Si',
      month: '2019-01',
      forecast: undefined,
      amount: -19200,
      partitionsLength: 1
    },
    {
      id: '2019-01:2ASvvWRLha',
      month: '2019-01',
      forecast: undefined,
      amount: -1690,
      partitionsLength: 1
    },
    {
      id: '2019-01:UNCLASSIFIED',
      month: '2019-01',
      forecast: undefined,
      amount: -194761,
      partitionsLength: 1
    }
  ])
})

test('Convert transaction currency', t => {
  const {convertTransactionCurrency} = t.context
  const transaction = {
    amount: 100,
    partitions: [{amount: 50}, {amount: 50}]
  }
  const currenciesData = {
    currencyRates,
    currencies,
    defaultCurrency: 'BRL'
  }
  let result = convertTransactionCurrency(transaction, currenciesData)
  t.deepEqual(result, {
    amount: 100,
    partitions: [{amount: 50}, {amount: 50}],
    currency: 'BRL',
    currencySymbol: 'R$'
  })
  transaction.currency = 'USD'
  result = convertTransactionCurrency(transaction, currenciesData)
  t.deepEqual(result, {
    amount: 415,
    partitions: [{amount: 208}, {amount: 207}],
    currency: 'BRL',
    currencySymbol: 'R$'
  })
  transaction.currency = 'EUR'
  result = convertTransactionCurrency(transaction, currenciesData)
  t.deepEqual(result, {
    amount: 454,
    partitions: [{amount: 227}, {amount: 227}],
    currency: 'BRL',
    currencySymbol: 'R$'
  })
  currenciesData.toCurrency = 'USD'
  result = convertTransactionCurrency(transaction, currenciesData)
  t.deepEqual(result, {
    amount: 109,
    partitions: [{amount: 55}, {amount: 54}],
    currency: 'USD',
    currencySymbol: '$'
  })
  transaction.rate = 1
  result = convertTransactionCurrency(transaction, currenciesData)
  t.deepEqual(result, {
    amount: 24,
    partitions: [{amount: 12}, {amount: 12}],
    currency: 'USD',
    currencySymbol: '$'
  })
})

test('Get time periods', t => {
  const {getTimePeriods} = t.context
  const periods = getTimePeriods('2019-09-27')
  const mapPeriods = map(period => {
    const {name, scope, ...rest} = period
    return rest
  })
  // console.log('TCL: periods', mapPeriods(periods))
  // console.log('TCL: periods', periods)
  t.deepEqual(mapPeriods(periods), [
    {from: '2019-10-05', to: '2019-10-27'},
    {from: '2019-09-29', to: '2019-10-04'},
    {from: '2019-09-28', to: '2019-09-28'},
    {from: '2019-09-27', to: '2019-09-27'},
    {from: '2019-09-26', to: '2019-09-26'},
    {from: '2019-09-20', to: '2019-09-25'},
    {from: '2019-08-27', to: '2019-09-19'},
    {to: '2019-08-26'}
  ])
})

test('Get transactions by time periods', t => {
  const {getTransactionsByTimePeriods} = t.context
  const localState = {...state, atlas: {holidays}}
  let periods = getTransactionsByTimePeriods(localState, {
    from: null,
    to: '2019-12-31',
    today: '2019-09-30',
    filter: ({status}) => status === 'due'
  })
  const mapPeriods = map(period => {
    const {from, to, calendar = {}} = period
    return {
      from,
      to,
      calendar: Object.keys(calendar)
    }
  })
  periods = mapPeriods(periods)
  // console.log('TCL: periods', util.inspect(periods, {depth: null}))
  t.deepEqual(periods, [
    {
      from: '2019-10-08',
      to: '2019-10-30',
      calendar: ['2019-10-10']
    },
    {
      from: '2019-10-02',
      to: '2019-10-07',
      calendar: ['2019-10-03']
    },
    {from: '2019-10-01', to: '2019-10-01', calendar: []},
    {from: '2019-09-30', to: '2019-09-30', calendar: []},
    {from: '2019-09-29', to: '2019-09-29', calendar: []},
    {from: '2019-09-23', to: '2019-09-28', calendar: []},
    {
      from: '2019-08-30',
      to: '2019-09-22',
      calendar: ['2019-09-03', '2019-09-10']
    },
    {
      from: undefined,
      to: '2019-08-29',
      calendar: [
        '2019-07-03',
        '2019-07-10',
        '2019-08-02',
        '2019-08-03',
        '2019-08-09'
      ]
    }
  ])
})

test('Get accounts balance', t => {
  const {getAccountsBalance, sumAccountsBalance} = t.context
  const localState = {...state, atlas: {holidays}}
  localState.docs['atlas/currencyRates'] = {data: currencyRates}
  const accountsBalance = getAccountsBalance(localState)
  const mapBalance = map(ab => {
    const {id, balance, bills} = ab
    return {
      id,
      balance,
      bills: bills && bills.length
    }
  })
  let ab = mapBalance(accountsBalance.regular)
  // console.log('TCL: accountsBalance', util.inspect(ab, {depth: null}))
  t.deepEqual(ab, [
    {id: 'CYbteYpzdA6', balance: 5390, bills: undefined},
    {id: 'AHIhOdX7cxo', balance: 3409, bills: undefined}
  ])
  ab = mapBalance(accountsBalance.foreignCurrency)
  // console.log('TCL: accountsBalance', util.inspect(ab, {depth: null}))
  t.deepEqual(ab, [{id: 'Gh7_Clk6Mu9', balance: 0, bills: undefined}])
  ab = mapBalance(accountsBalance.creditcard)
  // console.log('TCL: accountsBalance', util.inspect(ab, {depth: null}))
  t.deepEqual(ab, [
    {id: 'zi1OhUwoLhA', balance: -172800, bills: 9},
    {id: 'aCnwNryvhfp', balance: -23252, bills: 1},
    {id: 'CQ5B2aXn5QZ', balance: 0, bills: 0},
    {id: '-ssZsPnhWoo', balance: 0, bills: 0}
  ])

  let totals = sumAccountsBalance({...localState, pin: {}})
  // console.log('TCL: totals', util.inspect(totals, {depth: null}))
  t.deepEqual(totals, {
    total: -187253,
    type: {regular: 8799, creditcard: -196052, foreignCurrency: 0}
  })
  totals = sumAccountsBalance({
    ...localState,
    pin: {CYbteYpzdA6: true}
  })
  // console.log('TCL: totals', util.inspect(totals, {depth: null}))
  t.deepEqual(totals, {
    total: -187253,
    pinned: {
      total: 5390,
      type: {regular: 5390}
    },
    type: {regular: 8799, creditcard: -196052, foreignCurrency: 0}
  })
})
