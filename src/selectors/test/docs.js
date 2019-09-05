import test from 'ava'
// eslint-disable-next-line no-unused-vars
import util from 'util'

import loadDb from '../../../test/data/loadDb'
import '../../../test/lib/mock'

const db = 'solar'

const state = {
  app: {
    db
  },
  docs: loadDb(db)
}

test.before(async t => {
  const selectors = await import('../docs')
  Object.keys(selectors).forEach(p => {
    t.context[p] = selectors[p]
  })
})

test('Check solar model', t => {
  const {getAllCollections} = t.context
  const allCollections = getAllCollections(state)
  t.is(Object.keys(allCollections).length, 7)
})

test.skip('Get all transactions', t => {
  const {getTransactionsByDay} = t.context
  const transactions = getTransactionsByDay(state)
  // console.log('TCL: transactions', transactions)
  t.is(transactions.length, 'todo')
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
        }
      ]
    }
  })
  t.deepEqual(list, [
    {category: 'X', amount: 0.8},
    {category: 'Y', amount: 3.2},
    {category: 'A', amount: 0.5},
    {category: 'C', amount: 2.5}
  ])
})

test('Expand invoice', t => {
  const {expandInvoice} = t.context
  // toBeContinued expand creditcard payments
  const list = expandInvoice('9', {
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
        }
      ],
      parcels: [
        {amount: 4},
        {
          amount: 3
        }
      ]
    }
  })
  // console.log('TCL: list', util.inspect(list, {depth: null}))
  t.deepEqual(list, [
    {
      amount: 4,
      id: '9/1',
      partitions: [
        {category: 'X', amount: 0.46},
        {category: 'Y', amount: 1.83},
        {category: 'A', amount: 0.29},
        {category: 'C', amount: 1.42}
      ]
    },
    {
      amount: 3,
      id: '9/2',
      partitions: [
        {category: 'X', amount: 0.34},
        {category: 'Y', amount: 1.37},
        {category: 'A', amount: 0.21},
        {category: 'C', amount: 1.08}
      ]
    }
  ])
})
