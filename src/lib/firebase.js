import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
import 'firebase/auth'
import 'firebase/storage'

import firebaseConfig from '../loaders/firebase!'

firebase.initializeApp(firebaseConfig)

if (process.env.NODE_ENV === 'development') {
  console.log('Using firebase project', firebaseConfig.projectId)
}

export default firebase

export const functionsURL = `https://${firebaseConfig.locationId}1-${firebaseConfig.projectId}.cloudfunctions.net`

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
