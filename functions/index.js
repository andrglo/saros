const Koa = require('koa')
const cors = require('@koa/cors')
var Router = require('koa-router')

const axios = require('axios')

const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const app = new Koa()
const router = new Router()

const routes = require('./routes')
const checkBudget = require('./checkBudget')

app.use(cors())
app.use(async (ctx, next) => {
  console.log(ctx.path, ctx.query)
  if (!ctx.headers.key) {
    console.error('No token, header was:', ctx.headers)
    ctx.throw(401)
  }
  try {
    ctx.state.session = await admin
      .auth()
      .verifyIdToken(ctx.headers.key)
  } catch (err) {
    console.error('Invalid token, header was:', ctx.headers, err)
    ctx.throw(401)
  }
  await next()
})
routes({
  router,
  admin
})
app.use(router.routes())
exports.server = functions.https.onRequest(app.callback())

exports.updateCurrencyRates = functions.pubsub
  .schedule('0 */6 * * 1-5')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    const {fixer = {}} = functions.config().services || {}
    const result = await axios.get(
      `http://data.fixer.io/api/latest?access_key=${fixer.key}`
    )
    const {timestamp, date, success, ...data} = result.data
    if (success === true) {
      data.updatedAt = new Date(timestamp * 1000)
      await admin
        .firestore()
        .collection('atlas')
        .doc('currencyRates')
        .set(data)
    } else {
      console.error('Error reading fixer:', result.data)
    }
  })

exports.checkBudget = checkBudget
