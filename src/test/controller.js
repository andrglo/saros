/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-dynamic-require */
import test from 'ava'
import mockery from 'mockery'
import noop from 'lodash/noop'
import sortBy from 'lodash/sortBy'
import indexedDB from 'fake-indexeddb'

// eslint-disable-next-line no-unused-vars
import util from 'util'

// eslint-disable-next-line no-unused-vars
import sleep from '../../test/lib/sleep'
import completion from '../../test/lib/completion'

// console.log('', util.inspect(data, {depth: null}))

const db = 'solar'
const getCollectionPath = collection => `dbs/${db}/${collection}`
const DOC_STORE_NAME = 'docs'

let storeIsReady

global.indexedDB = indexedDB

const user = {
  uid: 'uid',
  email: 'andredagloria@gmail.com',
  isAnonymous: false,
  displayName: 'Andre',
  photoURL: ''
}

const auth = {
  currentUser: {
    ...user,
    getIdTokenResult: () =>
      Promise.resolve({
        claims: {
          dbs: {
            [db]: {}
          }
        },
        token: 'token'
      })
  },
  onAuthStateChanged: f =>
    completion(() => storeIsReady).then(() => {
      f(user)
    })
}

const getDocsFromFile = (file, query, payload) => () => {
  const collection = require(file)
  let recordset = []
  if (query) {
    if (query[0] === 'monthSpan') {
      const [, , month] = query
      Object.keys(collection).forEach(id => {
        const {monthSpan} = collection[id]
        if (monthSpan.includes(month)) {
          recordset.push({id, doc: {...collection[id]}})
        }
      })
    } else if (query[0] === 'updatedAt') {
      const n = payload
      Object.keys(collection).forEach(id => {
        recordset.push({id, doc: {...collection[id]}})
      })
      recordset = sortBy(recordset, 'doc.updatedAt')
      if (query[1] === 'desc') {
        recordset.reverse()
      }
      recordset = recordset.slice(0, n)
    }
  } else {
    Object.keys(collection).forEach(id => {
      recordset.push({id, doc: {...collection[id]}})
    })
  }
  return Promise.resolve({
    forEach: f => {
      for (const {id, doc} of recordset) {
        f({
          id,
          data: () => doc
        })
      }
    }
  })
}

let onSnapshotForInvoices

const firebase = {
  initializeApp: noop,
  auth: () => auth,
  firestore: () => ({
    collection: name => {
      const collection = name.split('/')[2]
      const file = `../../test/data/${db}/${collection}.json`
      return {
        get: getDocsFromFile(file),
        where: (...args) => {
          return {
            onSnapshot: f => {
              if (args[0] === 'updatedAt') {
                if (collection === 'invoices') {
                  onSnapshotForInvoices = f
                }
              }
            },
            get: getDocsFromFile(file, args)
          }
        },
        orderBy: (...args) => {
          return {
            limit: n => {
              return {
                get: getDocsFromFile(file, args, n)
              }
            }
          }
        },
        doc: () => ({
          onSnapshot: () => {}
        })
      }
    }
  }),
  database: () => ({
    ref: () => ({
      on: () => {}
    })
  })
}

const axios = {
  get: url => {
    if (url.startsWith('/locale')) {
      return Promise.resolve(require(`../../test${url}`))
    }
    throw new Error('url not handled by axios mock:' + url)
  },
  defaults: {
    headers: {
      common: {}
    }
  }
}

test.before(async t => {
  mockery.enable({warnOnUnregistered: false})
  mockery.registerMock('axios', axios)
  mockery.registerMock('firebase/app', firebase)
  mockery.registerMock('firebase/firestore', null)
  mockery.registerMock('firebase/auth', null)
  mockery.registerMock('firebase/database', null)
  mockery.registerMock('firebase/storage', null)
  const controller = await import('../controller')
  Object.keys(controller).forEach(p => {
    t.context[p] = controller[p]
  })
  const store = await controller.createStore()
  storeIsReady = true
  const docs = await import('../selectors/docs')
  Object.keys(docs).forEach(p => {
    t.context[p] = docs[p]
  })
  const {default: openLocalDb} = await import('../lib/localDb')
  t.context.localDb = await openLocalDb()
  await completion(() => store.getState().app.dbs.length > 0)
  // await sleep(100)
})

test.after(() => {
  mockery.deregisterAll()
})

test.serial('Check initialization', t => {
  const {getStore} = t.context
  t.is(Boolean(getStore), true)
  const state = getStore().getState()
  t.is(state.app.db, db)
  t.deepEqual(state.app.dbs, [db])
})

const tabs = [1, 2]
for (const tab of tabs) {
  test(`Subscribe (via selector) a fully cached collection - Tab ${tab}`, async t => {
    const {getStore, getBudgets, localDb} = t.context
    let state = getStore().getState()
    let budgets = getBudgets(state)
    t.is(budgets, undefined) // when empty return undefined
    await sleep(100) // wait collection load after subscription
    state = getStore().getState()
    budgets = getBudgets(state)
    t.is(Object.keys(budgets).length > 0, true)

    // check indexDb
    const record = await localDb.get(
      DOC_STORE_NAME,
      getCollectionPath('budgets')
    )
    t.deepEqual(Object.keys(record || {}), ['data', 'lastUpdatedAt'])
  })

  test(`Subscribe (via selector) a monthly cached collection - Tab ${tab}`, async t => {
    const {getStore, getInvoices, localDb} = t.context
    const options = {from: '2019-02', to: '2019-02'}
    let state = getStore().getState()
    let invoices = getInvoices(state, options)
    t.is(invoices, undefined) // when empty return undefined
    await sleep(100) // wait collection load after subscription
    state = getStore().getState()
    invoices = getInvoices(state, options)
    t.truthy(Object.keys(invoices).length > 0)

    const invoicesPath = getCollectionPath('invoices')
    const keys = (await localDb.getKeys(DOC_STORE_NAME))
      .filter(k => k.startsWith(invoicesPath))
      .sort()
    t.is(keys.length, 6)
    t.is(keys[0], invoicesPath)
    t.is(keys[1], `${invoicesPath}:*`)
    t.is(keys[2], `${invoicesPath}:2018-11`)
    t.is(keys[3], `${invoicesPath}:2018-12`)
    t.is(keys[4], `${invoicesPath}:2019-01`)
    t.is(keys[5], `${invoicesPath}:2019-02`)

    let localDbPath = invoicesPath
    let record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(record, {lastUpdatedAt: 1562856382788})

    localDbPath = `${invoicesPath}:*`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), ['BFMTePgome85'])

    localDbPath = `${invoicesPath}:2019-02`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), [])

    localDbPath = `${invoicesPath}:2019-01`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), [
      '1hn9Vgjmpjon',
      'RIo6Y1IwJO9',
      'ai8H2bFxt4jv',
      '6zzwHBvMRmmm',
      'XrE2xUBgkjPj',
      'tjuWBgnG42Rd',
      'LdfdmhY7wZMr'
    ])

    localDbPath = `${invoicesPath}:2018-12`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), [])

    localDbPath = `${invoicesPath}:2018-11`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), [])

    // pay invoice
    const invoice = {
      createdAt: '2019-07-03T18:46:48.477Z',
      updatedAt: '2019-07-12T14:46:22.788Z',
      flow: 'out',
      place: 'plVeVNFlY6M',
      issueDate: '2019-07-03',
      account: 'AHIhOdX7cxo',
      amount: -1000,
      dueDate: '2019-07-03',
      payDate: '2019-07-03',
      paidAmount: -1000,
      status: 'paid',
      parcels: [
        {
          amount: -1000,
          dueDate: '2019-08-03',
          status: 'paid',
          account: 'CYbteYpzdA6'
        },
        {
          amount: -1000,
          dueDate: '2019-07-03',
          status: 'paid',
          account: 'CYbteYpzdA6'
        }
      ],
      partitions: [
        {
          costCenter: 'eBhqeuMtrBu',
          category: 'InYNor0Si',
          description: 'Oven',
          amount: -2000
        },
        {
          costCenter: 'LXrJM4zYSjJ',
          category: 'InYNor0Si',
          description: 'Freezer',
          amount: -1000
        }
      ],
      monthSpan: ['2019-07', '2019-08']
    }
    onSnapshotForInvoices({
      size: 1,
      docChanges: () => ({
        forEach: f => {
          f({
            doc: {
              id: 'BFMTePgome85',
              data: () => invoice
            }
          })
        }
      })
    })
    await sleep(100)
    localDbPath = invoicesPath
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(record, {lastUpdatedAt: 1562942782788})
    localDbPath = `${invoicesPath}:*`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), [])
    t.deepEqual(record.lastUpdatedAt, undefined)
    localDbPath = `${invoicesPath}:2019-07`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), ['BFMTePgome85'])
    t.deepEqual(record.lastUpdatedAt, undefined)
    localDbPath = `${invoicesPath}:2019-08`
    record = await localDb.get(DOC_STORE_NAME, localDbPath)
    t.deepEqual(Object.keys(record.data), ['BFMTePgome85'])
    t.deepEqual(record.lastUpdatedAt, undefined)

    state = getStore().getState()
    invoices = getInvoices(state, options)
    t.is(Object.keys(invoices).length, 8)
    t.is(state.docs[invoicesPath].lastUpdatedAt, 1562942782788)
  })
}
