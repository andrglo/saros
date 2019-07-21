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

import {version, revision} from './loaders/version!'
import reducersConfig from './loaders/reducers!'

import openLocalDb from './lib/localDb'
import firebase, {
  realTimeDb,
  firestoreDb,
  toDate
} from './lib/firebase'

axios.defaults.baseURL =
  'https://us-central1-saros-development.cloudfunctions.net'

const log = debug('warden')

log('State configuration started')

const STATE_STORE_NAME = 'state'
const ENTITY_STORE_NAME = 'entities'
const PENDENT_STORE_NAME = 'pendent'
const INTERVAL_TO_SAVE_IN_CLOUD = 20000
const INTERVAL_TO_SAVE_IN_LOCAL_DB = 500
const REHYDRATE_STATE_KEY = 'REHYDRATE_STATE_KEY'
const UPDATE_AVAILABLE = 'app/UPDATE_AVAILABLE'
const SET_FORM = 'forma/SET_FORM'
const CLEAR_STATE = 'CLEAR_STATE'
const APP_REDUCER_NAME = 'app'
const IDLE_INTERVAL = 20000
const AWAIT_CONNECTION_INTERVAL = 500
const MAX_DOCS_READS_IN_SEEK = 36

let store
let localDb
const subscribedEntities = new Map()
const subscriptions = new Set()

const reducers = new Map()

const middleware = [thunk]

if (process.env.NODE_ENV !== 'production') {
  const actionsBlacklist = ['IDLE', 'REHYDRATE_STATE_KEY']
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
    const now = new Date().toISOString()
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
    displayName
  } = firebase.auth().currentUser
  currentUser = {
    uid,
    email,
    isAnonymous,
    displayName
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
  entities: (state = {}) => state
}
Object.keys(reducersConfig).forEach(path => {
  const config = reducersConfig[path]
  const options = config.options || {}
  const toBePersisted = Boolean(options.persist)
  if (toBePersisted) {
    reducers.set(path, options.persist)
  }
  if (typeof config.handlers === 'function') {
    childReducers[path] = (state, action) =>
      config.handlers(state, action, (state, nextState, key) =>
        saveStateChanges(state, nextState, path, key)
      )
  } else if (typeof config.handlers === 'object') {
    const handlers = config.handlers
    childReducers[path] = (state = config.initialState, action) => {
      const handler = handlers[action.type]
      if (!handler) {
        return state
      }
      const nextState = handler(state, action)
      if (toBePersisted) {
        saveStateChanges(state, nextState, path)
      }
      return nextState
    }
  } else {
    throw new Error(
      'Invalid reducer configuration',
      path,
      reducersConfig
    )
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
            : action.replace
            ? action.data
            : merge({}, state[root][key], action.data)
      } else {
        state[root] =
          action.data === null
            ? {}
            : action.replace
            ? action.data
            : merge({}, state[root], action.data)
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
  const keys = await localDb.getKeys(ENTITY_STORE_NAME)
  const dbs = []
  const initialState = {}
  for (const key of keys) {
    const match = key.match(/^dbs\/(\w+)$/)
    if (match) {
      // eslint-disable-next-line no-await-in-loop
      const license = await localDb.get(ENTITY_STORE_NAME, key)
      set(initialState, `${ENTITY_STORE_NAME}.${key}`, license)
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

  const pending = await localDb.getKeys(PENDENT_STORE_NAME)
  pending.sort()
  log('pending from last session', pending)
  for (const date of pending) {
    // eslint-disable-next-line no-await-in-loop
    const {type, list} = await localDb.get(PENDENT_STORE_NAME, date)
    if (type === 'state') {
      sendPendingItems(list) // do not wait, will block when offline
    } else {
      saveEntityBatch(list) // do not wait, will block when offline
    }
    localDb.delete(PENDENT_STORE_NAME, date)
  }

  const stateSubscribes = []
  for (const path of reducers.keys()) {
    stateSubscribes.push(subscribeState(currentUser.uid, path))
  }
  await Promise.all(stateSubscribes)
  for (const db of dbs) {
    subscribeEntity(`dbs/${db}`)
  }
  subscribeEntity(`users/${currentUser.uid}`)
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
  subscribedEntities.clear()
  await localDb.clearDb()
  await firebase.auth().signOut()
  timestamps.clear()
  store.dispatch({type: CLEAR_STATE})
}

firebase.auth().onAuthStateChanged(user => {
  log('onAuthStateChanged', user)
  if (user) {
    const justSignedIn = window.location.pathname === '/signin'
    connect(justSignedIn).then(() => {
      if (justSignedIn) {
        localDb.save(
          STATE_STORE_NAME,
          APP_REDUCER_NAME,
          store.getState().app
        )
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
    subscribedEntities.clear()
  }
})

const subscribeState = async (username, path) => {
  const options = reducers.get(path)
  if (!options) {
    console.error('Reducer options not found', path)
    return
  }
  const {list, locallyOnly} = options
  if (list) {
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
  if (list) {
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

export const saveStateChanges = async (before, after, path, key) => {
  const options = reducers.get(path)
  if (!options) {
    console.error('Reducer options not found', path, key)
    return
  }
  if (before === after) {
    return
  }
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

const updateEntityState = (path, entity) => {
  store.dispatch({
    type: REHYDRATE_STATE_KEY,
    key: `${ENTITY_STORE_NAME}.${path}`,
    data: entity,
    replace: true
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

const fetchEntity = async ({
  path,
  entity,
  query,
  month,
  transform
}) => {
  const snapshot = await query.get()
  console.warn('fetchEntity', path, month, snapshot.size)
  let lastUpdatedAt = 0
  const data = entity.data
  snapshot.forEach(doc => {
    const record = {...doc.data()}
    convertRecordTimestamps(record)
    if (record.updatedAt > lastUpdatedAt) {
      lastUpdatedAt = record.updatedAt
    }
    delete record.keywords
    delete record.monthSpan
    if (transform) {
      transform(data, doc.id, record)
    } else {
      data[doc.id] = record
    }
  })
  if (lastUpdatedAt > 0) {
    entity.lastUpdatedAt = lastUpdatedAt
  }
  await localDb.save(
    ENTITY_STORE_NAME,
    makeLocalDbKey(path, month),
    entity
  )
}

const getEntityFromLocalDb = async (path, months) => {
  let entity
  let missingMonths
  if (months) {
    const found = []
    for (const month of months) {
      // eslint-disable-next-line no-await-in-loop
      const monthEntity = await localDb.get(
        ENTITY_STORE_NAME,
        makeLocalDbKey(path, month)
      )
      if (monthEntity) {
        entity = entity || {data: {}}
        found.push(month)
        for (const id of Object.keys(monthEntity.data)) {
          entity.data[id] = monthEntity.data[id]
        }
        if (monthEntity.lastUpdatedAt > (entity.lastUpdatedAt || 0)) {
          entity.lastUpdatedAt = monthEntity.lastUpdatedAt
        }
      }
    }
    missingMonths = difference(months, found)
  } else {
    entity = await localDb.get(ENTITY_STORE_NAME, path)
  }
  return [entity, missingMonths]
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

export const subscribeEntity = async (path, options) => {
  const subscription = subscribedEntities.get(path)
  const isSubscribed = Boolean(subscription)
  const hasMonthlyCache = options && options.monthSpan
  const notCachedMonths =
    hasMonthlyCache &&
    getNotCachedMonths(options.monthSpan, subscription)
  if (!isSubscribed || notCachedMonths) {
    // not subscribed or has months to be cached
    subscribedEntities.set(
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
    let [entity, missingMonths] = await getEntityFromLocalDb(
      path,
      notCachedMonths
    )

    let stateUpdated
    while (!currentUser) {
      log('subscribeEntity waiting connection', path)
      // eslint-disable-next-line no-await-in-loop
      await sleep(AWAIT_CONNECTION_INTERVAL)
      if (!subscribedEntities.has(path)) {
        // disconnected
        return
      }
      // first wait to avoid flicking
      if (
        !currentUser &&
        entity &&
        entity.lastUpdatedAt > 0 &&
        !stateUpdated
      ) {
        updateEntityState(path, entity)
        log('subscribeEntity state updated when disconnected', path)
        stateUpdated = true
      }
    }
    log('subscribeEntity connected', path)

    if (missingMonths && missingMonths.length > 0) {
      entity = entity || {data: {}}
      for (const month of missingMonths) {
        const monthEntity = {data: {}}
        // eslint-disable-next-line no-await-in-loop
        await fetchEntity({
          path,
          month,
          entity: monthEntity,
          query: firestoreDb
            .collection(collection)
            .where('monthSpan', 'array-contains', month),
          transform
        })
        for (const id of Object.keys(monthEntity.data)) {
          entity.data[id] = monthEntity.data[id]
        }
        if (monthEntity.lastUpdatedAt > (entity.lastUpdatedAt || 0)) {
          entity.lastUpdatedAt = monthEntity.lastUpdatedAt
        }
      }
      if (entity.lastUpdatedAt > 0) {
        updateEntityState(path, entity)
      }
    } else if (!entity && !isSingleDocument) {
      entity = {data: {}}
      await fetchEntity({
        path,
        entity,
        query: firestoreDb.collection(collection),
        transform
      })
      if (entity.lastUpdatedAt > 0) {
        updateEntityState(path, entity)
      }
    } else if (entity && entity.lastUpdatedAt > 0 && !stateUpdated) {
      updateEntityState(path, entity)
    }

    if (isSubscribed) {
      // only for cached months
      return
    }

    if (isSingleDocument) {
      log(
        'subscribeEntity firestore will listen to document changes',
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
            const currentEntity =
              store.getState().entities[path] || {}
            log('firestore snapshot for document received', path)
            if (
              currentEntity.lastUpdatedAt !== undefined &&
              (data.updatedAt === undefined ||
                currentEntity.lastUpdatedAt === data.updatedAt)
            ) {
              return
            }
            const updatedAt = data.updatedAt
            delete data.updatedAt
            const entity = {
              ...currentEntity,
              data,
              lastUpdatedAt: updatedAt
            }
            localDb.save(ENTITY_STORE_NAME, path, entity)
            updateEntityState(path, entity)
          },
          err => {
            console.error(`In onSnapshot document ${path}`, err)
          }
        )
      )
    } else {
      log(
        'subscribeEntity will listen firestore where lastUpdatedAt >',
        entity.lastUpdatedAt,
        collection
      )
      const query = firestoreDb
        .collection(collection)
        .where(
          'updatedAt',
          '>',
          new Date(Number(entity.lastUpdatedAt) || 0)
        )
      subscriptions.add(
        query.onSnapshot(
          snapshot => {
            log('firestore snapshot for collection received', path)
            if (snapshot.size === 0) {
              return
            }
            console.warn(
              'firestore snapshot size is greater than 0',
              path,
              snapshot.size
            )
            entity = {
              ...(store.getState().entities[path] || {}),
              data: {...(entity.data || {})},
              lastUpdatedAt: Number(entity.lastUpdatedAt) || 0
            }
            const monthSpanReceived = {}
            snapshot.docChanges().forEach(change => {
              const doc = change.doc
              log(
                'subscription entity change firestore',
                path,
                change.type,
                doc,
                change,
                doc && doc.data()
              )
              const record = {...doc.data()}
              convertRecordTimestamps(record)
              const monthSpan = doc.monthSpan
              if (record.updatedAt > entity.lastUpdatedAt) {
                entity.lastUpdatedAt = record.updatedAt
              }
              const added = monthSpan && {}
              const deleted = monthSpan && []
              if (record.deletedAt) {
                delete entity.data[doc.id]
                if (deleted) {
                  deleted.push(doc.id)
                }
              } else {
                delete record.keywords
                delete record.monthSpan
                if (transform) {
                  transform(added || entity.data, doc.id, record)
                  if (added) {
                    Object.keys(added).forEach(key => {
                      entity.data[key] = added[key]
                    })
                  }
                } else {
                  entity.data[doc.id] = record
                  if (added) {
                    added[doc.id] = record
                  }
                }
              }
              if (monthSpan) {
                for (const month of monthSpan) {
                  monthSpanReceived[month] =
                    monthSpanReceived[month] || []
                  monthSpanReceived[month].push({added, deleted})
                }
              }
            })
            if (hasMonthlyCache) {
              const updateLocalDb = async (
                month,
                {added, deleted}
              ) => {
                const localDbKey = makeLocalDbKey(path, month)
                const entity = (await localDb.get(
                  ENTITY_STORE_NAME,
                  localDbKey
                )) || {data: {}}
                Object.keys(added).forEach(id => {
                  entity.data[id] = added[id]
                })
                deleted.forEach(id => {
                  delete entity.data[id]
                })
                await localDb.save(
                  ENTITY_STORE_NAME,
                  localDbKey,
                  entity
                )
              }
              for (const month of Object.keys(monthSpanReceived)) {
                updateLocalDb(month, monthSpanReceived[month])
              }
            } else {
              localDb.save(ENTITY_STORE_NAME, path, entity)
            }
            updateEntityState(path, entity)
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

export const saveEntityBatch = async list => {
  log('saveEntityBatch', 'firestore', list)
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
  const now = new Date().toISOString()
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

export const saveEntityDocument = async (path, id, doc, options) => {
  await saveEntityBatch([{path, id, doc, options}])
}

export const deleteEntityDocument = async (path, id, options) => {
  await saveEntityBatch([{path, id, toBeDeleted: true, options}])
}

export const seekEntity = async (path, keyword, options = {}) => {
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
  log('seekEntity', path, snapshot.size)
  const startAfter =
    snapshot.docs.length <= limit
      ? snapshot.docs[snapshot.docs.length - 1]
      : null
  const recordset = []
  if (snapshot.size) {
    const entity = {
      ...(store.getState().entities[path] || {data: {}})
    }
    const data = entity.data
    const subscription = subscribedEntities.get(path)
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
    updateEntityState(path, entity)
  }
  return [recordset, startAfter]
}

let serviceWorker
let updateAvailable
// if (process.env.NODE_ENV === 'production') {
//   serviceWorker = require('offline-plugin/runtime')
//   serviceWorker.install({
//     onUpdating: () => {
//       console.log('SW Event:', 'onUpdating')
//     },
//     onUpdateReady: () => {
//       console.log('SW Event:', 'onUpdateReady')
//       updateAvailable = true
//       if (store) {
//         // store ready then use store to rerender App immediately
//         store.dispatch({type: UPDATE_AVAILABLE})
//       }
//     },
//     onUpdated: () => {
//       console.log('SW Event:', 'onUpdated')
//       window.location.reload()
//     },
//     onUpdateFailed: () => {
//       console.log('SW Event:', 'onUpdateFailed')
//     }
//   })
// }
export const hasUpdateAvailable = () => updateAvailable
export const updateApp = () => {
  if (updateAvailable) {
    store.dispatch({type: UPDATE_AVAILABLE, clear: true}) // to hide notification immediately
    serviceWorker.applyUpdate()
  }
}

console.info(
  `Loaded saros version ${version} revision ` +
    `${revision} in ${process.env.NODE_ENV} mode`
)
