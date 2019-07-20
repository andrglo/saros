import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
import 'firebase/auth'
import 'firebase/storage'

firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
})

export default firebase

export const firestoreDb = firebase.firestore()
export const realTimeDb = firebase.database()
export const toDate = date => {
  if (!date) {
    return date
  }
  if (date.toDate) {
    date = date.toDate()
  } else if (date.seconds) {
    date = new firebase.firestore.Timestamp(
      date.seconds,
      date.nanoseconds
    ).toDate()
  } else if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  return date
}
export const toDateISOString = date => {
  if (!date) {
    return date
  }
  return toDate(date).toISOString()
}
export const getTimestampMillis = date => {
  if (date.toMillis) {
    return date.toMillis()
  }
  if (date.seconds) {
    return new firebase.firestore.Timestamp(
      date.seconds,
      date.nanoseconds
    ).toMillis()
  }
  return date && date.getTime()
}

// Not necessary, will bloat indexDb
// firestore.enablePersistence({synchronizeTabs: true}).catch(function(err) {
//   console.error(err)
// })
