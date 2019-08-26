const fs = require('fs')
const path = require('path')
const util = require('util')
const axios = require('axios')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const stat = util.promisify(fs.stat)

const targetFolder = '../src/assets/atlas'

const isFile = async filename => {
  try {
    return (await stat(filename)).isFile()
  } catch (err) {
    if (err.errno !== -2) {
      console.error(err)
      throw err
    }
  }
}

const extractRequiredInfo = async filename => {
  if (!(await isFile(filename))) {
    const result = await axios.get(
      'https://restcountries.eu/rest/v2/all'
    )
    await writeFile(filename, JSON.stringify(result.data, null, '  '))
  }
  const countries = JSON.parse((await readFile(filename)).toString())
  const currencies = {}
  const data = {}
  for (const country of countries) {
    const currency = country.currencies && country.currencies[0]
    if (currency && currency.code) {
      data[country.alpha2Code] = {
        name: country.name,
        nativeName: country.nativeName,
        currency: currency.code,
        flag: country.flag
      }
      currencies[currency.code] = {
        name: currency.name,
        symbol: currency.symbol,
        country: country.alpha2Code
      }
    }
  }
  await writeFile(
    path.join(__dirname, targetFolder, 'countries.json'),
    JSON.stringify(data, null, '  ')
  )
  await writeFile(
    path.join(__dirname, targetFolder, 'currencies.json'),
    JSON.stringify(currencies, null, '  ')
  )
}
extractRequiredInfo(path.join(__dirname, 'restcountries.json'))
  .then(() => {
    console.log('Done!')
  })
  .catch(err => {
    console.error(err)
  })
