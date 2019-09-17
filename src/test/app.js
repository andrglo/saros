/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-dynamic-require */
import test from 'ava'
import {
  fireEvent,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import mockery from 'mockery'
import noop from 'lodash/noop'
import sortBy from 'lodash/sortBy'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'

// eslint-disable-next-line no-unused-vars
import util from 'util'

// eslint-disable-next-line no-unused-vars
import sleep from '../../test/lib/sleep'

// console.log('', util.inspect(data, {depth: null}))

const db = 'solar'

const LOGIN_TIMEOUT = 500

global.indexedDB = indexedDB
global.IDBKeyRange = IDBKeyRange

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
  onAuthStateChanged: f => setTimeout(() => f(user), LOGIN_TIMEOUT)
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
            onSnapshot: noop,
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
      return Promise.resolve({data: require(`../../test${url}`)})
    }
    throw new Error('url not handled by axios mock:' + url)
  },
  defaults: {
    headers: {
      common: {}
    }
  }
}

test.before(() => {
  mockery.enable({warnOnUnregistered: false})
  mockery.registerMock('axios', axios)
  mockery.registerMock('firebase/app', firebase)
  mockery.registerMock('firebase/firestore', null)
  mockery.registerMock('firebase/auth', null)
  mockery.registerMock('firebase/database', null)
  mockery.registerMock('firebase/storage', null)
  mockery.registerMock('./index.css', null)
  mockery.registerMock('./assets/wave.svg', '')
  mockery.registerMock('./assets/dispersarpago.svg', '')
  window.matchMedia = () => ({
    addListener: noop,
    removeListener: noop
  })
  const div = document.createElement('div')
  div.setAttribute('id', 'saros')
  document.body.appendChild(div)
})

test.after(() => {
  mockery.deregisterAll()
})

test.serial('Open app', async t => {
  await import('..')
  await sleep(LOGIN_TIMEOUT + 100)
  const workspace = document.querySelector('.workspace')
  t.truthy(workspace)
})

const clickButtonWithText = async text => {
  const toolbar = document.querySelector('.toolbar')
  const toolbarButtons = toolbar.querySelectorAll('button')
  const profileButton = toolbarButtons[toolbarButtons.length - 1]

  fireEvent.click(profileButton)
  await sleep(50)
  const allButtons = document
    .querySelector('.toolbar')
    .querySelectorAll('button')

  for (const button of allButtons) {
    if (button.textContent === text) {
      fireEvent.click(button)
      break
    }
  }
  await sleep(50)
}

test.serial('Edit my account', async t => {
  await clickButtonWithText('My account')
  t.truthy(document.querySelector('form'))
})

test.serial('Edit preferences', async t => {
  await clickButtonWithText('Preferences')
  const inputsLabel = document
    .querySelector('.workspace')
    .querySelectorAll('label')
  t.is(inputsLabel.length, 2)
  t.is(inputsLabel[0].textContent, 'ThemeSystem')
  t.is(inputsLabel[1].textContent, 'LanguageEnglish')
})
