import test from 'ava'
import mockery from 'mockery'
import noop from 'lodash/noop'
import sumBy from 'lodash/sumBy'
import round from 'lodash/round'
import map from 'lodash/fp/map'

// eslint-disable-next-line no-unused-vars
import util from 'util'

import loadDb from '../../../test/data/loadDb'
import completion from '../../../test/lib/completion'
import sleep from '../../../test/lib/sleep'
import '../../lib/polyfill'

const db = 'solar'

const state = {
  app: {
    db
  },
  atlas: {},
  docs: loadDb(db)
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

const controller = {
  subscribeCollection: noop,
  convertRecordTimestamps: noop
}

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

test('Check solar model', t => {
  const {getAllCollections} = t.context
  const allCollections = getAllCollections(state)
  t.is(Object.keys(allCollections).length, 7)
})

test('Redistribute amount', t => {
  const {redistributeAmount} = t.context
  const list = redistributeAmount(
    [
      {
        amount: 1
      },
      {
        amount: 2
      },
      {
        amount: 3
      }
    ],
    10
  )
  t.deepEqual(list, [
    {
      amount: 1.67
    },
    {
      amount: 3.33
    },
    {
      amount: 5
    }
  ])
})

test('Get partitions', t => {
  const {getPartitions} = t.context
  const list = getPartitions('9', {
    '1': {
      parcels: [{amount: 10}],
      partitions: [
        {
          category: 'X',
          amount: 2
        },
        {
          category: 'Y',
          amount: 8
        }
      ]
    },
    '2': {
      parcels: [
        {amount: 4},
        {
          amount: 6,
          partitions: [
            {
              category: 'A',
              amount: 1
            },
            {
              category: 'C',
              amount: 5
            }
          ]
        }
      ],
      partitions: [
        {
          category: 'A',
          amount: 2
        },
        {
          category: 'B',
          amount: 8
        }
      ]
    },
    '4': {
      parcels: [{amount: 2}],
      billedFrom: [
        {
          id: '2/1',
          amount: 1
        }
      ]
    },
    '9': {
      billedFrom: [
        {
          id: '1',
          amount: 4,
          description: 'first'
        },
        {
          id: '2/2',
          amount: 3,
          description: 'second'
        },
        {
          id: '4',
          amount: 0.5,
          description: 'third'
        }
      ]
    }
  })
  // console.log('TCL: list', list)
  t.deepEqual(list, [
    {category: 'X', amount: 0.8},
    {category: 'Y', amount: 3.2},
    {category: 'A', amount: 0.5},
    {category: 'C', amount: 2.5},
    {category: 'A', amount: 0.1},
    {category: 'B', amount: 0.4}
  ])
})

test.serial('Get holidays for accounts', async t => {
  const {getHolidaysForAccounts} = t.context
  const actions = []
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
})

test('Get invoices last bill', t => {
  const {getInvoicesLastBill, getInvoices} = t.context
  const invoicesLastBill = getInvoicesLastBill(getInvoices(state))
  t.deepEqual(invoicesLastBill, {
    ai8H2bFxt4jv: {id: 'ai8H2bFxt4jv', amount: -16.9},
    '6zzwHBvMRmmm': {
      id: '6zzwHBvMRmmm',
      installment: 1,
      amount: -232.52,
      balance: -232.52
    },
    XrE2xUBgkjPj: {id: 'XrE2xUBgkjPj', amount: -563},
    tjuWBgnG42Rd: {id: 'tjuWBgnG42Rd', amount: -89.7}
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

  const total = 333.33
  let remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      payDate: '2019-08-30',
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
        t.is(Math.abs(round(remainingAmount, 2)), 0)
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
  t.is(round(sumBy(remainingPayments, 'amount'), 2), total)

  const mapDueDates = map('dueDate')

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
      payDate: '2018-11-09',
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

  t.deepEqual(mapDueDates(remainingPayments), [
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
      payDate: '2019-01-20',
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

  t.deepEqual(mapDueDates(remainingPayments), [
    '2019-01-31',
    '2019-02-28',
    '2019-04-01'
  ])

  remainingPayments = getRemainingPaymentsForCreditcard({
    transaction: {
      id: 'zero',
      amount: total,
      payDate: '2019-01-21',
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
  t.deepEqual(mapDueDates(remainingPayments), [
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
      payDate: '2018-12-30',
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
  t.deepEqual(mapDueDates(remainingPayments), [
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
  t.deepEqual(mapDueDates(remainingPayments), [
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
  t.deepEqual(mapDueDates(remainingPayments), ['2019-03-08'])
})

test('Expand invoice', t => {
  const {expandInvoice, getAccounts} = t.context
  const invoices = {
    '1': {
      parcels: [{amount: 10}],
      partitions: [
        {
          category: 'X',
          description: 'category X',
          amount: 2
        },
        {
          category: 'Y',
          amount: 8
        }
      ]
    },
    '2': {
      parcels: [
        {amount: 4},
        {
          amount: 6,
          partitions: [
            {
              category: 'A',
              amount: 1
            },
            {
              category: 'C',
              amount: 5
            }
          ]
        }
      ],
      partitions: [
        {
          category: 'A',
          amount: 2
        },
        {
          category: 'B',
          amount: 8
        }
      ]
    },
    '3': {
      type: 'ccard',
      installments: 3,
      parcels: [{amount: 100, payDate: '2019-07-10'}],
      partitions: [
        {
          category: 'X',
          amount: 100
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '4': {
      parcels: [{amount: 1}],
      billedFrom: [
        {
          id: '2/1',
          amount: 1
        }
      ]
    },
    '5': {
      type: 'ccard',
      installments: 10,
      parcels: [{amount: 99, payDate: '2018-07-10'}],
      partitions: [
        {
          category: 'X',
          amount: 99
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '6': {
      type: 'ccard',
      installments: 10,
      parcels: [{amount: 99, payDate: '2018-07-10'}],
      partitions: [
        {
          category: 'X',
          amount: 99
        }
      ],
      account: '-ssZsPnhWoo'
    },
    '7': {
      billedFrom: [
        {
          id: '6',
          amount: 9.9,
          installment: 10,
          balance: 10
        }
      ],
      parcels: [{amount: 9.9}]
    },
    '8': {
      billedFrom: [
        {
          id: '5',
          amount: 9.9,
          installment: 8,
          balance: 10
        }
      ],
      parcels: [{amount: 9.9}]
    },
    '9': {
      billedFrom: [
        {
          id: '1',
          amount: 4
        },
        {
          id: '2/2',
          amount: 3
        },
        {
          id: '4',
          amount: 0.5
        },
        {
          amount: 0.87,
          description: 'dif',
          partitions: [
            {
              category: 'D',
              amount: 0.87
            }
          ]
        },
        {
          amount: 0.03,
          description: 'extra dif'
        }
      ],
      parcels: [
        {amount: 4},
        {
          amount: 4.3
        }
      ]
    }
  }
  let list = expandInvoice('9', {invoices})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  // .38+1.52+.24+1.19+.05+.19+.41+.02=4
  // .41+1.64+.26+1.28+.05+.2+.45+.01=4.3
  t.deepEqual(list, [
    {
      amount: 4,
      id: '9/1',
      partitions: [
        {category: 'X', description: 'category X', amount: 0.38},
        {category: 'Y', amount: 1.52},
        {category: 'A', amount: 0.24},
        {category: 'C', amount: 1.19},
        {category: 'A', amount: 0.05},
        {category: 'B', amount: 0.19},
        {
          amount: 0.41,
          description: 'dif',
          category: 'D'
        },
        {amount: 0.02, description: 'extra dif'}
      ]
    },
    {
      amount: 4.3,
      id: '9/2',
      partitions: [
        {category: 'X', description: 'category X', amount: 0.41},
        {category: 'Y', amount: 1.64},
        {category: 'A', amount: 0.26},
        {category: 'C', amount: 1.28},
        {category: 'A', amount: 0.05},
        {category: 'B', amount: 0.2},
        {
          amount: 0.45,
          description: 'dif',
          category: 'D'
        },
        {amount: 0.01, description: 'extra dif'}
      ]
    }
  ])
  list = expandInvoice('4', {invoices})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      amount: 1,
      id: '4',
      partitions: [
        {category: 'A', amount: 0.2},
        {category: 'B', amount: 0.8}
      ]
    }
  ])
  list = expandInvoice('2', {invoices})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      partitions: [
        {category: 'A', amount: 0.8},
        {category: 'B', amount: 3.2}
      ],
      amount: 4,
      id: '2/1'
    },
    {
      partitions: [
        {category: 'A', amount: 1},
        {category: 'C', amount: 5}
      ],
      amount: 6,
      id: '2/2'
    }
  ])
  list = expandInvoice('1', {invoices})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      partitions: [
        {category: 'X', amount: 2, description: 'category X'},
        {category: 'Y', amount: 8}
      ],
      amount: 10,
      id: '1'
    }
  ])

  const accounts = getAccounts(state)
  list = expandInvoice('3', {invoices, holidays, accounts})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      type: 'ccard',
      installments: 3,
      partitions: [{category: 'X', amount: 100}],
      account: '-ssZsPnhWoo',
      amount: 100,
      payDate: '2019-07-10',
      id: '3'
    },
    {
      billedFrom: '3',
      type: 'ccardBill',
      amount: 33.33,
      status: 'draft',
      issueDate: '2019-07-31',
      dueDate: '2019-07-31',
      account: '-ssZsPnhWoo',
      partitions: [{category: 'X', amount: 33.33}],
      installment: 1,
      installments: 3,
      balance: 66.67
    },
    {
      billedFrom: '3',
      type: 'ccardBill',
      amount: 33.33,
      status: 'draft',
      issueDate: '2019-08-31',
      dueDate: '2019-09-02',
      account: '-ssZsPnhWoo',
      partitions: [{category: 'X', amount: 33.33}],
      installment: 2,
      installments: 3,
      balance: 33.34
    },
    {
      billedFrom: '3',
      type: 'ccardBill',
      amount: 33.34,
      status: 'draft',
      issueDate: '2019-09-30',
      dueDate: '2019-09-30',
      account: '-ssZsPnhWoo',
      partitions: [{category: 'X', amount: 33.34}],
      installment: 3,
      installments: 3,
      balance: 0
    }
  ])

  list = expandInvoice('5', {invoices, holidays, accounts})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      type: 'ccard',
      installments: 10,
      partitions: [{category: 'X', amount: 99}],
      account: '-ssZsPnhWoo',
      amount: 99,
      payDate: '2018-07-10',
      id: '5'
    },
    {
      billedFrom: '5',
      type: 'ccardBill',
      amount: 5,
      status: 'draft',
      issueDate: '2019-03-31',
      dueDate: '2019-04-01',
      account: '-ssZsPnhWoo',
      partitions: [{category: 'X', amount: 5}],
      installment: 9,
      installments: 10,
      balance: 5
    },
    {
      billedFrom: '5',
      type: 'ccardBill',
      amount: 5,
      status: 'draft',
      issueDate: '2019-04-30',
      dueDate: '2019-04-30',
      account: '-ssZsPnhWoo',
      partitions: [{category: 'X', amount: 5}],
      installment: 10,
      installments: 10,
      balance: 0
    }
  ])

  list = expandInvoice('6', {invoices, holidays, accounts})
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      type: 'ccard',
      installments: 10,
      partitions: [{category: 'X', amount: 99}],
      account: '-ssZsPnhWoo',
      amount: 99,
      payDate: '2018-07-10',
      id: '6'
    }
  ])
})

test('Get monthly due dates', t => {
  const {getMonthlyDueDates} = t.context
  const account = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getMonthlyDueDates('2019-01-31', '2019-12-31', {
    dayOfMonth: 31,
    onlyInBusinessDays: 'previous',
    holidays,
    account
  })
  t.deepEqual(dueDates, [
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

  dueDates = getMonthlyDueDates('2019-09-02', '2019-10-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'next',
    holidays,
    account
  })
  t.deepEqual(dueDates, ['2019-09-02', '2019-10-01'])

  dueDates = getMonthlyDueDates('2019-10-01', '2019-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    startedAt: '2019-10-01',
    interval: 3,
    account
  })
  console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-10-01', '2019-12-30'])

  dueDates = getMonthlyDueDates('2020-01-02', '2020-03-31', {
    dayOfMonth: 31,
    onlyInBusinessDays: 'next',
    holidays,
    startedAt: '2019-01-02',
    interval: 2,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2020-01-31', '2020-03-31'])
})

test('Get yearly due dates', t => {
  const {getYearlyDueDates} = t.context
  const account = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getYearlyDueDates('2019-01-31', '2019-12-31', {
    dayOfMonth: 31,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    onlyInBusinessDays: 'previous',
    holidays,
    account
  })
  t.deepEqual(dueDates, [
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
    account
  })
  t.deepEqual(dueDates, ['2019-09-02', '2019-10-01'])

  dueDates = getYearlyDueDates('2019-10-01', '2019-12-31', {
    dayOfMonth: 1,
    months: [12],
    onlyInBusinessDays: 'previous',
    holidays,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-11-29'])

  dueDates = getYearlyDueDates('2019-10-01', '2021-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    months: ['1', '10'],
    startedAt: '2019-10-01',
    interval: 3,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-10-01', '2021-12-30'])
  dueDates = getYearlyDueDates('2019-10-01', '2021-12-31', {
    dayOfMonth: 1,
    onlyInBusinessDays: 'previous',
    holidays,
    months: ['1', '10'],
    startedAt: '1989-10-01',
    interval: 3,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-10-01', '2021-12-30'])
})

test('Get weekly due dates', t => {
  const {getWeeklyDueDates} = t.context
  const account = {
    country: 'BR',
    state: 'MG',
    city: 'Belo Horizonte'
  }
  let dueDates = getWeeklyDueDates('2019-02-24', '2019-03-31', {
    dayOfWeek: 1,
    onlyInBusinessDays: 'next',
    interval: 2,
    holidays,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-03-06', '2019-03-18'])

  dueDates = getWeeklyDueDates('2019-11-20', '2019-12-30', {
    dayOfWeek: 2,
    onlyInBusinessDays: 'previous',
    startedAt: '2019-11-20',
    interval: 3,
    holidays,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-12-10', '2019-12-30'])

  dueDates = getWeeklyDueDates('2019-02-24', '2019-03-31', {
    dayOfWeek: 1,
    onlyInBusinessDays: 'next',
    startedAt: '2018-12-30',
    interval: 2,
    holidays,
    account
  })
  // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  t.deepEqual(dueDates, ['2019-03-06', '2019-03-18'])
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
      bestDay: 25
    }
  }
  const budget = {
    partitions: [
      {
        costCenter: 'A',
        category: 'a',
        description: 'Mine',
        amount: -203.4
      },
      {
        costCenter: 'B',
        category: 'b',
        description: 'My son',
        amount: -105.42
      }
    ],
    flow: 'out',
    place: 'vxbJp9WfTu0',
    account: '1',
    frequency: 'monthly',
    dayOfMonth: 10,
    onlyInBusinessDays: 'previous',
    date: '2019-01-10',
    notes: 'Health plan'
  }
  let transactions = expandBudget('b', '2019-02-24', '2019-03-31', {
    budget,
    holidays,
    accounts
  })
  // console.log(
  //   'TCL: transactions',
  //   util.inspect(transactions, {depth: null})
  // )
  t.deepEqual(transactions, [
    {
      flow: 'out',
      place: 'vxbJp9WfTu0',
      notes: 'Health plan',
      partitions: [
        {
          costCenter: 'A',
          category: 'a',
          description: 'Mine',
          amount: -203.4
        },
        {
          costCenter: 'B',
          category: 'b',
          description: 'My son',
          amount: -105.42
        }
      ],
      issueDate: '2019-03-08',
      dueDate: '2019-03-08',
      amount: -308.82,
      account: '1',
      id: 'b@2019-03-08'
    }
  ])
  // toBeContinued...
  // dueDates = expandBudget('2019-11-20', '2019-12-30', {
  //   dayOfWeek: 2,
  //   onlyInBusinessDays: 'previous',
  //   startedAt: '2019-11-20',
  //   interval: 3,
  //   holidays,
  //   account
  // })
  // // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  // t.deepEqual(dueDates, ['2019-12-10', '2019-12-30'])

  // dueDates = expandBudget('2019-02-24', '2019-03-31', {
  //   dayOfWeek: 1,
  //   onlyInBusinessDays: 'next',
  //   startedAt: '2018-12-30',
  //   interval: 2,
  //   holidays,
  //   account
  // })
  // // console.log('TCL: dueDates', util.inspect(dueDates, {depth: null}))
  // t.deepEqual(dueDates, ['2019-03-06', '2019-03-18'])
})
