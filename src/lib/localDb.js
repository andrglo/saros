import debug from 'debug'

const log = debug('localDb')

const LOCAL_DATABASE_NAME = 'saros'
const DATABASE_VERSION = 3
const STORE_NAMES = ['docs', 'state', 'pendent']

const db = {}

const development = process.env.NODE_ENV === 'development'

export default () =>
  new Promise((resolve, reject) => {
    if (db.handler) {
      resolve(db)
    }
    const request = indexedDB.open(
      LOCAL_DATABASE_NAME,
      DATABASE_VERSION
    )
    request.onupgradeneeded = event => {
      const dbHandler = event.target.result
      for (const storeName of STORE_NAMES) {
        if (!dbHandler.objectStoreNames.contains(storeName)) {
          dbHandler.createObjectStore(storeName)
        }
      }
    }
    request.onsuccess = event => {
      db.handler = event.target.result
      db.handler.onerror = event => {
        console.error(`Database error: ${event.target.errorCode}`)
      }
      resolve(db)
    }
    request.onerror = event => {
      reject(event.target.error)
    }
  })

const getObjectStore = (name, mode) => {
  const transaction = db.handler.transaction(name, mode)
  transaction.onerror = () => {
    log('transaction error occurred', name, mode)
    console.error(transaction.error)
  }
  return transaction.objectStore(name)
}

const clearStorage = name =>
  new Promise((resolve, reject) => {
    const store = getObjectStore(name, 'readwrite')
    const request = store.clear()
    request.onerror = () => {
      console.error(request.error)
      reject(request.error)
    }
    request.onsuccess = () => {
      resolve()
    }
  })

db.clearDb = async () => {
  const tasks = []
  for (const storeName of STORE_NAMES) {
    tasks.push(clearStorage(storeName))
  }
  await Promise.all(tasks)
}

db.save = (storeName, key, obj) =>
  new Promise((resolve, reject) => {
    if (development) {
      if (obj && !Array.isArray(obj) && typeof obj === 'object') {
        obj = {...obj}
        obj._size = JSON.stringify(obj).length
        obj._keys = Object.keys(obj.data || {}).length
      }
    }
    const request = getObjectStore(storeName, 'readwrite').put(
      obj,
      key
    )
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

db.delete = (storeName, key) =>
  new Promise((resolve, reject) => {
    const request = getObjectStore(storeName, 'readwrite').delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

db.get = (storeName, key) =>
  new Promise((resolve, reject) => {
    const request = getObjectStore(storeName).get(key)
    if (development) {
      request.onsuccess = () => {
        const obj = request.result
        if (obj && !Array.isArray(obj) && typeof obj === 'object') {
          delete obj._size
          delete obj._keys
        }
        resolve(obj)
      }
    } else {
      request.onsuccess = () => resolve(request.result)
    }
    request.onerror = () => reject(request.error)
  })

db.getKeys = (storeName, from, to) =>
  new Promise((resolve, reject) => {
    let range
    if (from && to) {
      range = IDBKeyRange.bound(from, to)
    }
    const request = getObjectStore(storeName).getAllKeys(range)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
