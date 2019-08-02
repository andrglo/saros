// from https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage

const functions = require('firebase-functions')
const {google} = require('googleapis')
const {auth} = require('google-auth-library')

const PROJECT_ID = process.env.GCLOUD_PROJECT
const PROJECT_NAME = `projects/${PROJECT_ID}`
const billing = google.cloudbilling('v1').projects

module.exports = functions.pubsub
  .topic('budget')
  .onPublish(async message => {
    const budget = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    )
    if (budget.costAmount > budget.budgetAmount) {
      await setAuthCredential()
      if (await isBillingEnabled(PROJECT_NAME)) {
        disableBillingForProject(PROJECT_NAME)
      } else {
        console.log('Billing already disabled')
      }
    } else {
      console.log(
        `No action necessary. (Current cost: ${budget.costAmount})`
      )
    }
  })

const setAuthCredential = async () => {
  const res = await auth.getApplicationDefault()

  let client = res.credential
  if (client.hasScopes && !client.hasScopes()) {
    client = client.createScoped([
      'https://www.googleapis.com/auth/cloud-billing',
      'https://www.googleapis.com/auth/cloud-platform'
    ])
  }

  // Set credential globally for all requests
  google.options({
    auth: client
  })
}

const isBillingEnabled = async projectName => {
  const res = await billing.getBillingInfo({name: projectName})
  return res.data.billingEnabled
}

const disableBillingForProject = async projectName => {
  const res = await billing.updateBillingInfo({
    name: projectName,
    resource: {billingAccountName: ''} // Disable billing
  })
  console.log(`Billing disabled: ${JSON.stringify(res.data)}`)
}
