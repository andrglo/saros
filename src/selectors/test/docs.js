import test from 'ava'
import mockery from 'mockery'
import noop from 'lodash/noop'

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

test('Expand invoice', t => {
  const {expandInvoice} = t.context
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
    '4': {
      parcels: [{amount: 1}],
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
      id: '4/1',
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
      id: '1/1'
    }
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

test('Get due dates for credit cards', t => {
  const {getDueDatesForCreditcard} = t.context

  let dueDates = getDueDatesForCreditcard({
    account: {
      dueDay: 8,
      country: 'BR',
      state: 'MG',
      city: 'Belo Horizonte'
    },
    from: '2019-09',
    to: '2020-12',
    holidays
  })
  t.deepEqual(dueDates, [
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
  ])

  dueDates = getDueDatesForCreditcard({
    account: {
      dueDay: 20,
      country: 'BR',
      state: 'MG',
      city: 'Betim'
    },
    from: '2018-11',
    to: '2019-06',
    holidays
  })
  t.deepEqual(dueDates, [
    '2018-11-21',
    '2018-12-20',
    '2019-01-21',
    '2019-02-20',
    '2019-03-20',
    '2019-04-22',
    '2019-05-20',
    '2019-06-21'
  ])
})
