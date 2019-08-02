const deburr = require('lodash/deburr')

module.exports = str => deburr((str || '').trim().toLowerCase())
