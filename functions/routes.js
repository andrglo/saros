const shortid = require('shortid')

const MINUTE = 60000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const YEAR = 365 * DAY

// eslint-disable-next-line no-unused-vars
const throwIfNotOwner = (ctx, db) => {
  const {dbs = {}} = ctx.state.session
  if (!dbs[db] || dbs[db].role !== 'owner') {
    ctx.throw(403)
  }
}

module.exports = ({router, admin}) => {
  router.post('/init/user', async ctx => {
    let {
      session: {uid, dbs}
    } = ctx.state
    let result = false
    if (!dbs) {
      const db = shortid.generate()
      dbs = {
        [db]: {
          role: 'owner'
        }
      }
      await admin.auth().setCustomUserClaims(uid, {dbs})
      await admin
        .firestore()
        .collection('dbs')
        .doc(db)
        .set({
          expireOn: new Date(Date.now() + YEAR), // todo handle accordingly
          updatedAt: new Date()
        })
      result = true
    }
    ctx.body = result
  })
}
