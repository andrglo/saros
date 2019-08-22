const fs = require('fs')
const path = require('path')
const util = require('util')
const axios = require('axios')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const stat = util.promisify(fs.stat)

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

let source

module.exports = function loader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for atlas is async')
    process.exit(1)
  }
  if (source) {
    callback(null, source)
    return
  }

  const extractRequiredInfo = async filename => {
    if (!(await isFile(filename))) {
      const result = await axios.get(
        'https://restcountries.eu/rest/v2/all'
      )
      await writeFile(
        filename,
        JSON.stringify(result.data, null, '  ')
      )
    }
    const countries = JSON.parse(
      (await readFile(filename)).toString()
    )
    const currencies = {}
    const data = {}
    for (const country of countries) {
      const countryCurrencies = []
      for (const currency of country.currencies) {
        if (currency.code) {
          countryCurrencies.push(currency.code)
          currencies[currency.code] = {
            name: currency.name,
            symbol: currency.symbol
          }
        }
      }
      data[country.alpha2Code] = {
        name: country.name,
        nativeName: country.nativeName,
        currency: countryCurrencies[0],
        flag: country.flag
      }
      for (const currency of country.currencies) {
        if (currency.code) {
          currencies[currency.code] = {
            name: currency.name,
            symbol: currency.symbol
          }
        }
      }
    }
    return JSON.stringify({countries: data, currencies}, null, '  ')
  }
  extractRequiredInfo(
    path.join(__dirname, '../assets/countries.json')
  ).then(data => {
    const source = `export default ${data}`
    callback(null, source)
  })
}
