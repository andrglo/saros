import {
  combineReducers,
  applyMiddleware,
  compose,
  createStore as createReduxStore
} from 'redux'
import {batch} from 'react-redux'
import thunk from 'redux-thunk'
import set from 'lodash/set'
import debounce from 'lodash/debounce'
import omit from 'lodash/omit'
import difference from 'lodash/difference'
import merge from 'lodash/merge'
import axios from 'axios'
import debug from 'debug'

import {version, revision} from './loaders/version'
import reducersConfig from './loaders/reducers'

// pre-load others loaders to avoid hot loader errors
import './loaders/themes'

import openLocalDb from './lib/localDb'
import firebase, {
  realTimeDb,
  firestoreDb,
  toDate,
  functionsURL
} from './lib/firebase'
import {
  setUpdateAvailable,
  clearUpdateAvailable,
  setBrowserLocation
} from './reducers/app'
import {fetchLocale} from './lib/translate'
import {pushBrowserLocation} from './actions/app'
import {getLocale} from './selectors/app'

axios.defaults.baseURL = functionsURL

const log = debug('controller')

log('State configuration started')

const STATE_STORE_NAME = 'state'
const DOC_STORE_NAME = 'docs'
const PENDENT_STORE_NAME = 'pendent'
const INTERVAL_TO_SAVE_IN_CLOUD = 20000
const INTERVAL_TO_SAVE_IN_LOCAL_DB = 500
const REHYDRATE_STATE_KEY = 'REHYDRATE_STATE_KEY'
const REHYDRATE_BUNDLE = 'REHYDRATE_BUNDLE'
const SET_FORM = 'SET_FORM'
const CLEAR_STATE = 'CLEAR_STATE'
const APP_REDUCER_NAME = 'app'
const IDLE_INTERVAL = 20000
const AWAIT_CONNECTION_INTERVAL = 500
const MAX_DOCS_READS_IN_SEEK = 36

let store
let localDb
const subscribedCollections = new Map()
export const unsubscribeCollection =
  process.env.NODE_ENV === 'test'
    ? collection => subscribedCollections.delete(collection)
    : null
const subscriptions = new Set()

const reducers = new Map()

const middleware = [thunk]

if (process.env.NODE_ENV === 'development') {
  const actionsBlacklist = [
    'IDLE',
    REHYDRATE_STATE_KEY,
    REHYDRATE_BUNDLE
  ]
  const {createLogger} = require('redux-logger')
  middleware.push(
    createLogger({
      predicate: (getState, action) =>
        !actionsBlacklist.includes(action.type),
      collapsed: true,
      duration: false,
      timestamp: true,
      logErrors: false,
      diff: false
    })
  )
}

const sleep = milliseconds =>
  new Promise(resolve => setTimeout(() => resolve(), milliseconds))

const timestamps = new Map()

export const getStore = () => store

const savePendingItems = async items => {
  // log('savePendingItems', 'localDb', items)
  for (const [path, data] of items) {
    try {
      localDb.save(STATE_STORE_NAME, path, data)
    } catch (err) {
      console.error(err)
    }
  }
}

let pendingItemsToSaveInLocalDb = new Map()
const saveInLocalDb = debounce(() => {
  const toSaveInLocalDb = pendingItemsToSaveInLocalDb
  pendingItemsToSaveInLocalDb = new Map()
  savePendingItems(toSaveInLocalDb)
}, INTERVAL_TO_SAVE_IN_LOCAL_DB)

const updateState = (key, data, options = {}) => {
  if (data !== undefined) {
    // log(
    //   'updateState check',
    //   key,
    //   options,
    //   data,
    //   data && data.timestamp,
    //   timestamps.get(key) || 0,
    //   timestamps
    // )
    if (
      !data ||
      !data.timestamp ||
      data.timestamp > (timestamps.get(key) || 0)
    ) {
      timestamps.set(key, (data && data.timestamp) || 0)
      store.dispatch({type: REHYDRATE_STATE_KEY, key, data})
      // log('options.saveToLocalDb', options.saveToLocalDb, data, options)
      if (options.saveToLocalDb) {
        if (data === null) {
          localDb.delete(STATE_STORE_NAME, key)
        } else {
          localDb
            .get(STATE_STORE_NAME, key)
            .then(state => {
              // log('state received', JSON.stringify(state))
              // if (state) log('state data', state.timestamp, data.timestamp)
              if (
                !state ||
                !state.timestamp ||
                state.timestamp < (data.timestamp || 0)
              ) {
                state = state ? merge(state, data) : data
                // log('updateState', 'localDb', 'saving', JSON.stringify(state))
                localDb.save(STATE_STORE_NAME, key, state)
              }
            })
            .catch(err => {
              console.error(err)
            })
        }
      }
    }
  }
}

let pendingItemsToSaveInCloud = new Map()

const sendPendingItems = async items => {
  const uid = store.getState().app.user.uid
  // log('sendPendingItems', 'realTimeDb', items)
  const saveItem = async item => {
    let [path, data] = item
    let [root, key] = path.split('.')
    root = `${uid}/${root}`
    const now = window.performance.now()
    await localDb.save(PENDENT_STORE_NAME, now, {
      type: 'state',
      list: [[path, data]]
    })
    try {
      const dbRef = realTimeDb.ref(root)
      data = JSON.parse(JSON.stringify(data)) // to remove undefined
      console.warn('state will be sent to realtimeDb', root, key)
      if (key) {
        await dbRef.child(encodeURIComponent(key)).set(data)
      } else {
        await dbRef.set(data)
      }
    } catch (err) {
      log('ERROR in sendPendingItems')
      console.error(err)
    }
    await localDb.delete(PENDENT_STORE_NAME, now)
  }
  const tasks = []
  for (const item of items) {
    tasks.push(saveItem(item))
  }
  await Promise.all(tasks)
}

const saveInCloud = debounce(() => {
  const toSaveInCloud = pendingItemsToSaveInCloud
  pendingItemsToSaveInCloud = new Map()
  sendPendingItems(toSaveInCloud)
}, INTERVAL_TO_SAVE_IN_CLOUD)

window.onfocus = () => {
  saveInCloud.flush()
  saveInLocalDb.flush()
}

window.onbeforeunload = () => {
  saveInCloud.flush()
  saveInLocalDb.flush()
}

document.addEventListener(
  'visibilitychange',
  () => {
    saveInCloud.flush()
    saveInLocalDb.flush()
  },
  false
)

let currentUser
const initCurrentUser = idTokenResult => {
  // log('firebase getIdTokenResult result', idTokenResult)
  const {claims = {}, token} = idTokenResult
  // log('firebase current user', firebase.auth().currentUser)
  const {
    uid,
    email,
    isAnonymous,
    displayName,
    photoURL
  } = firebase.auth().currentUser
  currentUser = {
    uid,
    email,
    isAnonymous,
    displayName,
    photoURL
  }
  axios.defaults.headers.common.key = token
  let dbs = []
  if (claims.dbs) {
    currentUser.dbs = claims.dbs
    dbs = Object.keys(claims.dbs)
  }
  store.dispatch({
    type: REHYDRATE_STATE_KEY,
    key: APP_REDUCER_NAME,
    data: {
      user: currentUser,
      dbs
    }
  })
  return dbs
}

let childReducers = {
  now: (state, action) => (action.type === 'IDLE' ? Date.now() : 0),
  docs: (state = {}) => state
}
Object.keys(reducersConfig).forEach(path => {
  const config = reducersConfig[path]
  const options = config.options || {}
  const toBePersisted = Boolean(options.persist)
  const splitByProperty =
    toBePersisted && options.persist.splitByProperty === true
  if (toBePersisted) {
    reducers.set(path, options.persist)
  }
  const handlers = config.handlers
  childReducers[path] = (state = config.initialState, action) => {
    const handler = handlers[action.type]
    if (!handler) {
      return state
    }
    const nextState = handler(state, action)
    if (toBePersisted) {
      if (splitByProperty) {
        const keysBefore = Object.keys(state)
        const keysAfter = Object.keys(nextState)
        for (const key of new Set([...keysBefore, ...keysAfter])) {
          const before = state[key]
          if (before) {
            // when no before assumes that is auto generated
            // and do not need to be saved
            const after = nextState[key]
            saveStateChanges(before, after || null, path, key)
          }
        }
      } else {
        saveStateChanges(state, nextState, path)
      }
    }
    return nextState
  }
})

childReducers = combineReducers(childReducers)

const rootReducer = (state, action) => {
  switch (action.type) {
    case REHYDRATE_STATE_KEY: {
      state = {...state}
      const [root, key] = action.key.split('.')
      if (key) {
        state[root] = {...state[root]}
        state[root][key] =
          action.data === null
            ? {}
            : merge({}, state[root][key], action.data)
      } else {
        state[root] =
          action.data === null
            ? {}
            : merge({}, state[root], action.data)
      }
      return state
    }
    case REHYDRATE_BUNDLE: {
      const {collection, bundle} = action
      const docs = state[DOC_STORE_NAME]
      const previousBundle = docs[collection] || {
        data: {}
      }
      const previousLastUpdatedAt = previousBundle.lastUpdatedAt || 0
      const lastUpdatedAt = bundle.lastUpdatedAt || 0
      state = {
        ...state,
        [DOC_STORE_NAME]: {
          ...docs,
          [collection]: {
            data: {
              ...(previousBundle.data || {}),
              ...(bundle.data || {})
            },
            lastUpdatedAt:
              lastUpdatedAt > previousLastUpdatedAt
                ? lastUpdatedAt
                : previousLastUpdatedAt
          }
        }
      }
      return state
    }
    case CLEAR_STATE: {
      return childReducers(undefined, {type: '@@INIT'})
    }
    default:
      return childReducers(state, action)
  }
}

const composeEnhancers =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const createStore = async () => {
  localDb = await openLocalDb()
  const keys = await localDb.getKeys(DOC_STORE_NAME)
  const dbs = []
  const initialState = {}
  for (const key of keys) {
    const match = key.match(/^dbs\/(\w+)$/)
    if (match) {
      // eslint-disable-next-line no-await-in-loop
      const license = await localDb.get(DOC_STORE_NAME, key)
      set(initialState, `${DOC_STORE_NAME}.${key}`, license)
      dbs.push(match[1])
    }
  }
  const app =
    (await localDb.get(STATE_STORE_NAME, APP_REDUCER_NAME)) ||
    reducersConfig[APP_REDUCER_NAME].initialState
  app.dbs = dbs
  app.db = app.lastDb || dbs[0]
  if (app.timestamp) {
    timestamps.set(APP_REDUCER_NAME, app.timestamp)
  }
  await fetchLocale(getLocale({app}))
  initialState[APP_REDUCER_NAME] = app
  store = createReduxStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middleware))
  )

  const idleDispatcher = () => {
    store.dispatch({type: 'IDLE'})
  }
  store.subscribe(
    debounce(() => {
      requestAnimationFrame(() =>
        requestIdleCallback(idleDispatcher, {timeout: 100})
      )
    }, IDLE_INTERVAL)
  )

  log('store created')
  return store
}

const processPendingTasks = async () => {
  const pending = (await localDb.getKeys(PENDENT_STORE_NAME)).map(
    Number
  )
  pending.sort()
  log('pending from last session', pending)
  for (const instant of pending) {
    // eslint-disable-next-line no-await-in-loop
    const {type, ...payload} = await localDb.get(
      PENDENT_STORE_NAME,
      String(instant)
    )
    switch (type) {
      case 'state':
        sendPendingItems(payload.list) // do not wait, will block when offline
        break
      case 'states':
        saveDocBatch(payload.list) // do not wait, will block when offline
        break
      default:
        console.error('Invalid pendent db record:', type, payload)
    }
    localDb.delete(PENDENT_STORE_NAME, instant)
  }
}

const connect = async justSignedIn => {
  let dbs = initCurrentUser(
    await firebase.auth().currentUser.getIdTokenResult()
  )
  if (dbs.length === 0) {
    await axios.post('/server/init/user')
    dbs = initCurrentUser(
      await firebase.auth().currentUser.getIdTokenResult()
    )
  }
  if (justSignedIn && dbs[0]) {
    store.dispatch({
      type: REHYDRATE_STATE_KEY,
      key: APP_REDUCER_NAME,
      data: {
        db: dbs[0]
      }
    })
  }

  await processPendingTasks() // should be executed only after connection

  const stateSubscribes = []
  for (const path of reducers.keys()) {
    stateSubscribes.push(subscribeState(currentUser.uid, path))
  }
  await Promise.all(stateSubscribes)
  for (const db of dbs) {
    subscribeCollection(`dbs/${db}`)
  }
  subscribeCollection(`users/${currentUser.uid}`)
}

export const disconnect = async () => {
  saveInCloud.flush()
  const unsubscribes = []
  for (const unsubscribe of subscriptions) {
    unsubscribes.push(unsubscribe())
  }
  await Promise.all(unsubscribes)
  currentUser = null
  subscriptions.clear()
  subscribedCollections.clear()
  await localDb.clearDb()
  await firebase.auth().signOut()
  timestamps.clear()
  store.dispatch({type: CLEAR_STATE})
}

firebase.auth().onAuthStateChanged(user => {
  log('onAuthStateChanged', user)
  if (user) {
    const justSignedIn = !store.getState().app.db
    connect(justSignedIn).then(() => {
      if (justSignedIn) {
        localDb.save(
          STATE_STORE_NAME,
          APP_REDUCER_NAME,
          omit(store.getState().app, reducers.get('app').omit)
        )
        store.dispatch(pushBrowserLocation('/'))
      }
    })
  } else if (currentUser) {
    console.warn('Logging out by unknown reason!')
    currentUser = null
    localDb.clearDb()
    timestamps.clear()
    store.dispatch({type: CLEAR_STATE})
    for (const unsubscribe of subscriptions) {
      unsubscribe()
    }
    subscriptions.clear()
    subscribedCollections.clear()
  }
})

const subscribeState = async (username, path) => {
  const options = reducers.get(path)
  if (!options) {
    console.error('Reducer options not found', path)
    return
  }
  const {splitByProperty, locallyOnly} = options
  if (splitByProperty === true) {
    const keys = await localDb.getKeys(STATE_STORE_NAME)
    const prefix = `${path}.`
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        // eslint-disable-next-line no-await-in-loop
        updateState(key, await localDb.get(STATE_STORE_NAME, key))
      }
    }
  } else {
    updateState(path, await localDb.get(STATE_STORE_NAME, path))
  }
  if (locallyOnly === true) {
    return
  }
  const dbRef = realTimeDb.ref(`${username}/${path}`)
  log(
    'subscribeState',
    'realTimeDb',
    'will listen to',
    username,
    path
  )
  if (splitByProperty === true) {
    const update = (data, toBeDeleted) => {
      if (!data) {
        return
      }
      updateState(
        `${path}.${decodeURIComponent(data.key)}`,
        toBeDeleted ? null : data.val(),
        {
          saveToLocalDb: true
        }
      )
    }
    subscriptions.add(
      dbRef.on('child_added', data => {
        log(
          'subscription state_child_added',
          path,
          data && data.key,
          data && data.val()
        )
        update(data)
      })
    )
    subscriptions.add(
      dbRef.on('child_changed', data => {
        log(
          'subscription state_child_changed',
          path,
          data && data.key,
          data && data.val()
        )
        update(data)
      })
    )
    subscriptions.add(
      dbRef.on('child_removed', data => {
        log(
          'subscription state_child_removed',
          path,
          data && data.key,
          data && data.val()
        )
        update(data, true)
      })
    )
  } else {
    subscriptions.add(
      dbRef.on('value', data => {
        log(
          'subscription state_value_added',
          path,
          data && data.key,
          data && data.val()
        )
        if (!data || !data.val()) {
          return
        }
        const val = data.val()
        if (path === APP_REDUCER_NAME) {
          val.connected = true
        }
        updateState(path, val, {saveToLocalDb: true})
      })
    )
  }
}

const saveStateChanges = async (before, after, path, key = '') => {
  if (before === after) {
    return
  }
  const options = reducers.get(path)
  if (!options) {
    console.error('Reducer options not found', path, key)
    return
  }
  // log('saveStateChanges started', {before, after, path, key, options})
  path = key ? `${path}.${key}` : path
  if (after) {
    if (options.omit) {
      before = omit(before, options.omit)
      after = omit(after, options.omit)
    }
    const oldKeys = Object.keys(before)
    let modified = oldKeys.length !== Object.keys(after).length
    if (!modified) {
      for (const key of oldKeys) {
        modified = !Object.is(before[key], after[key])
        if (modified) {
          log('key', key, 'differs', before[key], after[key])
          break
        }
      }
    }
    if (!modified) {
      return
    }
    const now = Date.now()
    timestamps.set(path, now)
    after = {...after, timestamp: now}
    pendingItemsToSaveInLocalDb.set(path, after)
    saveInLocalDb()
    if (Array.isArray(options.locallyOnly)) {
      after = omit(after, options.locallyOnly)
    }
  } else {
    log('saveStateChanges deleting in localDb', path, key, before)
    await localDb.delete(STATE_STORE_NAME, path)
  }
  if (options.locallyOnly === true) {
    log(
      'saveStateChanges not sending to realTimeDb, locally only',
      path,
      key
    )
    return
  }
  console.warn('saveStateChanges will sync state', path, key)
  pendingItemsToSaveInCloud.set(path, after)
  saveInCloud()
}

const updateBundle = (path, bundle) => {
  store.dispatch({
    type: REHYDRATE_BUNDLE,
    collection: path,
    bundle
  })
}

export const convertRecordTimestamps = record => {
  if (record.updatedAt) {
    record.updatedAt = toDate(record.updatedAt).getTime()
  }
  if (record.createdAt) {
    record.createdAt = toDate(record.createdAt).getTime()
  }
}

const makeLocalDbKey = (path, month) =>
  `${path}${month ? `:${month}` : ''}`

const fetchDocs = async ({path, bundle, query, month, transform}) => {
  const snapshot = await query.get()
  console.warn('fetchDocs', path, month, snapshot.size)
  let lastUpdatedAt = 0
  const data = bundle.data
  snapshot.forEach(doc => {
    const record = {...doc.data()}
    convertRecordTimestamps(record)
    if (record.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = record.updatedAt
    }
    if (data) {
      // when cached by month the main bundle only stores lastUpdatedAt,
      // so no data
      delete record.keywords
      delete record.monthSpan
      if (transform) {
        transform(data, doc.id, record)
      } else {
        data[doc.id] = record
      }
    }
  })
  if (!month && lastUpdatedAt > 0) {
    // when cache lastUpdatedAt is stored only in the main bundle
    bundle.lastUpdatedAt = lastUpdatedAt
  }
  await localDb.save(
    DOC_STORE_NAME,
    makeLocalDbKey(path, month),
    bundle
  )
}

const getBundleFromLocalDb = async (path, months) => {
  const bundle = await localDb.get(DOC_STORE_NAME, path)
  if (!bundle) {
    return [null, months]
  }
  let missingMonths
  if (months) {
    const found = []
    bundle.data = {}
    for (const month of months) {
      // eslint-disable-next-line no-await-in-loop
      const monthBundle = await localDb.get(
        DOC_STORE_NAME,
        makeLocalDbKey(path, month)
      )
      if (monthBundle) {
        found.push(month)
        for (const id of Object.keys(monthBundle.data)) {
          bundle.data[id] = monthBundle.data[id]
        }
      }
    }
    missingMonths = difference(months, found)
  }
  return [bundle, missingMonths]
}

const getNotCachedMonths = (months, subscription = {}) => {
  if (months) {
    months = Array.isArray(months) ? months : months.split(',')
    if (subscription.cachedMonths) {
      months = difference(months, subscription.cachedMonths)
    }
    if (months.length > 0) {
      return months
    }
  }
  return null
}

const saveDocChangesToLocalDb = async ({
  collection,
  changes,
  bundle,
  hasMonthlyCache
}) => {
  if (hasMonthlyCache) {
    let keys = await localDb.getKeys(
      DOC_STORE_NAME,
      collection + ':',
      collection + ':\uffff'
    )
    keys = keys.map(key => key.match(/:(.+)$/)[1])
    const updates = []
    const updateLocalDb = async (month, docs) => {
      const localDbKey = makeLocalDbKey(collection, month)
      const bundle = (await localDb.get(
        DOC_STORE_NAME,
        localDbKey
      )) || {
        data: {}
      }
      let wasUpdated
      for (const {id, doc} of docs) {
        if (doc) {
          bundle.data[id] = doc
          wasUpdated = true
        } else if (bundle.data[id]) {
          delete bundle.data[id]
          wasUpdated = true
        }
      }
      if (wasUpdated) {
        await localDb.save(DOC_STORE_NAME, localDbKey, bundle)
      }
    }
    const toBeUpdated = {}
    for (const {id, doc, monthSpan} of changes) {
      const bundlesToDelete = new Set(...keys)
      for (const month of monthSpan) {
        toBeUpdated[month] = toBeUpdated[month] || []
        toBeUpdated[month].push({id, doc})
        bundlesToDelete.delete(month)
      }
      for (const month of bundlesToDelete) {
        toBeUpdated[month] = toBeUpdated[month] || []
        toBeUpdated[month].push({id})
      }
    }
    for (const month of Object.keys(toBeUpdated)) {
      updates.push(updateLocalDb(month, toBeUpdated[month]))
    }
    await Promise.all(updates)
    bundle = {...bundle}
    delete bundle.data
  }
  await localDb.save(DOC_STORE_NAME, collection, bundle)
}

export const subscribeCollection = async (path, options) => {
  const subscription = subscribedCollections.get(path)
  const isSubscribed = Boolean(subscription)
  const hasMonthlyCache = Boolean(options && options.monthSpan)
  const notCachedMonths =
    hasMonthlyCache &&
    getNotCachedMonths(options.monthSpan, subscription)
  if (!isSubscribed || notCachedMonths) {
    // not subscribed or has months to be cached
    subscribedCollections.set(
      path,
      hasMonthlyCache
        ? {
            options,
            cachedMonths: [
              ...((subscription || {}).cachedMonths || []),
              ...(notCachedMonths || [])
            ]
          }
        : {options}
    )

    const transform = options && options.transform
    const parts = path.split('/')
    const type = parts.length % 2 === 0 ? 'document' : 'collection'
    const isSingleDocument = type === 'document'
    const collection = !isSingleDocument
      ? path
      : parts.slice(0, parts.length - 1).join('/')
    let [bundle, missingMonths] = await getBundleFromLocalDb(
      path,
      notCachedMonths
    )

    let stateUpdated
    while (!currentUser) {
      log('subscribeCollection waiting connection', path)
      // eslint-disable-next-line no-await-in-loop
      await sleep(AWAIT_CONNECTION_INTERVAL)
      if (!subscribedCollections.has(path)) {
        // disconnected
        return
      }
      // first wait to avoid flicking
      if (
        !currentUser &&
        bundle &&
        bundle.lastUpdatedAt > 0 &&
        !stateUpdated
      ) {
        updateBundle(path, bundle)
        log(
          'subscribeCollection state updated when disconnected',
          path
        )
        stateUpdated = true
      }
    }
    log('subscribeCollection connected', path)

    if (missingMonths && missingMonths.length > 0) {
      bundle = bundle || {data: {}}
      if (!bundle.lastUpdatedAt) {
        const mainBundle = {}
        await fetchDocs({
          path,
          bundle: mainBundle,
          query: firestoreDb
            .collection(collection)
            .orderBy('updatedAt', 'desc')
            .limit(1)
        })
        bundle.lastUpdatedAt = mainBundle.lastUpdatedAt
      }
      for (const month of missingMonths) {
        const monthBundle = {data: {}}
        // eslint-disable-next-line no-await-in-loop
        await fetchDocs({
          path,
          month,
          bundle: monthBundle,
          query: firestoreDb
            .collection(collection)
            .where('monthSpan', 'array-contains', month),
          transform
        })
        bundle.data = {...bundle.data, ...monthBundle.data}
      }
      if (bundle.lastUpdatedAt > 0) {
        updateBundle(path, bundle)
      }
    } else if (!bundle && !isSingleDocument) {
      bundle = bundle || {data: {}}
      await fetchDocs({
        path,
        bundle,
        query: firestoreDb.collection(collection),
        transform
      })
      if (bundle.lastUpdatedAt > 0) {
        updateBundle(path, bundle)
      }
    } else if (bundle && bundle.lastUpdatedAt > 0 && !stateUpdated) {
      updateBundle(path, bundle)
    }

    if (isSubscribed) {
      // only for cached months
      return
    }

    if (isSingleDocument) {
      log(
        'subscribeCollection firestore will listen to document changes',
        path
      )
      const doc = firestoreDb
        .collection(collection)
        .doc(parts[parts.length - 1])
      subscriptions.add(
        doc.onSnapshot(
          snapshot => {
            const data = {...snapshot.data()}
            convertRecordTimestamps(data)
            const bundle = store.getState().docs[path] || {}
            log('firestore snapshot for document received', path)
            if (
              bundle.lastUpdatedAt !== undefined &&
              (data.updatedAt === undefined ||
                bundle.lastUpdatedAt === data.updatedAt)
            ) {
              return
            }
            bundle.lastUpdatedAt = data.updatedAt
            bundle.data = data
            updateBundle(path, bundle)
            localDb.save(DOC_STORE_NAME, path, bundle)
          },
          err => {
            console.error(`In onSnapshot document ${path}`, err)
          }
        )
      )
    } else {
      log(
        'subscribeCollection will listen firestore where lastUpdatedAt >',
        bundle.lastUpdatedAt,
        collection
      )
      const query = firestoreDb
        .collection(collection)
        .where(
          'updatedAt',
          '>',
          new Date(Number(bundle.lastUpdatedAt) || 0)
        )
      subscriptions.add(
        query.onSnapshot(
          snapshot => {
            if (snapshot.size === 0) {
              return
            }
            console.warn(
              'firestore snapshot received',
              path,
              snapshot.size
            )
            const bundle = store.getState().docs[collection]
            const changes = []
            snapshot.docChanges().forEach(change => {
              const id = change.doc.id
              let doc = {...change.doc.data()}
              log('firestore', change.type, path, id, doc)
              convertRecordTimestamps(doc)
              if (doc.updatedAt > bundle.lastUpdatedAt) {
                bundle.lastUpdatedAt = doc.updatedAt
              }
              const monthSpan = doc.monthSpan
              if (doc.deletedAt) {
                delete bundle.data[doc.id]
              } else {
                delete doc.keywords
                delete doc.monthSpan
                if (transform) {
                  transform(bundle.data, id, doc)
                  doc = bundle.data[id]
                } else {
                  bundle.data[id] = doc
                }
              }
              changes.push({id, doc, monthSpan})
            })
            updateBundle(path, bundle)
            saveDocChangesToLocalDb({
              collection: path,
              changes,
              bundle,
              hasMonthlyCache
            })
          },
          err => {
            console.error(`In onSnapshot collection ${path}`, err)
          }
        )
      )
    }
  }
}

const makeFullDocumentPath = path =>
  path.includes('/') ? path : `dbs/${store.getState().app.db}/${path}`

export const saveDocBatch = async list => {
  log('saveDocBatch', 'firestore', list)
  const firestoreBatch = firestoreDb.batch()
  for (const item of list) {
    let {path, id, doc, toBeDeleted} = item
    path = makeFullDocumentPath(path)
    const docRef = firestoreDb.doc(id ? `${path}/${id}` : path)
    doc = {
      ...doc,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }
    if (toBeDeleted) {
      doc.deletedAt = firebase.firestore.FieldValue.serverTimestamp()
    }
    firestoreBatch.set(docRef, doc, {merge: true})
  }
  const now = window.performance.now()
  await localDb.save(PENDENT_STORE_NAME, now, {list})
  try {
    log('batch commit started')
    await firestoreBatch.commit()
    log('batch commit ended')
  } catch (err) {
    log('ERROR in batch commit => restoring forms')
    console.error(err)
    batch(() => {
      for (const item of list) {
        if (item.options && item.options.form) {
          const [formName, form] = item.options.form
          store.dispatch({type: SET_FORM, formName, form})
        }
      }
    })
  } finally {
    await localDb.delete(PENDENT_STORE_NAME, now)
  }
}

export const saveDocDocument = async (path, id, doc, options) => {
  await saveDocBatch([{path, id, doc, options}])
}

export const deleteDocDocument = async (path, id, options) => {
  await saveDocBatch([{path, id, toBeDeleted: true, options}])
}

export const seekDoc = async (path, keyword, options = {}) => {
  const limit =
    options.limit < MAX_DOCS_READS_IN_SEEK
      ? options.limit
      : MAX_DOCS_READS_IN_SEEK
  let query = firestoreDb
    .collection(path)
    .where('keyword', 'array-contains', keyword)
    .orderBy('createdAt', 'desc')
    .limit(limit)
  if (options.startAfter) {
    query = query.startAfter(options.startAfter)
  }
  const snapshot = await query.get()
  log('seekDoc', path, snapshot.size)
  const startAfter =
    snapshot.docs.length <= limit
      ? snapshot.docs[snapshot.docs.length - 1]
      : null
  const recordset = []
  if (snapshot.size) {
    const bundle = {
      ...(store.getState().docs[path] || {data: {}})
    }
    const data = bundle.data
    const subscription = subscribedCollections.get(path)
    const transform =
      subscription &&
      subscription.options &&
      subscription.options.transform
    snapshot.forEach(doc => {
      const record = {...doc.data()}
      convertRecordTimestamps(record)
      delete record.keywords
      delete record.monthSpan
      if (transform) {
        transform(data, doc.id, record)
      } else {
        data[doc.id] = record
      }
      recordset.push({id: doc.id, ...record})
    })
    updateBundle(path, bundle)
  }
  return [recordset, startAfter]
}

const serviceWorker = window.sarosSW
if (serviceWorker) {
  serviceWorker.addEventListener('updatefound', () => {
    console.log('SW event:', 'updatefound')
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        console.log('SW event:', 'controllerchange')
        store.dispatch(clearUpdateAvailable()) // to hide notification immediately
        window.location.reload()
      }
    )
    store.dispatch(setUpdateAvailable())
  })
}
export const updateApp = () => {
  if (serviceWorker && serviceWorker.waiting) {
    serviceWorker.waiting.postMessage({type: 'SKIP_WAITING'})
  }
}

window.onpopstate = event => {
  log(
    `onpopstate: ${document.location}, state: ${JSON.stringify(
      event.state
    )}`
  )
  const {pathname, search: query} = document.location
  store.dispatch(
    setBrowserLocation({
      pathname,
      query,
      state: event.state
    })
  )
}

console.info(
  `Loaded saros version ${version} revision ` +
    `${revision} in ${process.env.NODE_ENV} mode`
)
