import snakeCase from 'lodash/snakeCase'
import axios from 'axios'
import normalize from './normalize'

let translations = {}
let currentLocale

export const fetchLocale = locale => {
  if (process.env.NODE_ENV === 'production') {
    if (currentLocale === locale) {
      return Promise.resolve(false) // did not change
    }
  }
  currentLocale = locale
  if (locale.startsWith('pt')) {
    locale = 'pt-BR'
  } else {
    locale = 'en'
  }
  return axios
    .get(`/locale/${locale}.json`, {
      baseURL: null
    })
    .then(result => {
      console.log('New locale selected:', locale)
      setTranlations(result.data)
      return true // changed
    })
    .catch(err => {
      currentLocale = null
      console.error(err)
    })
}

export const setTranlations = newTranslations => {
  translations = newTranslations
}

const t = (strs, ...params) => {
  const requirePlural = typeof params[0] === 'number'
  const plural = requirePlural && Number(params[0]) > 1
  let text = ``
  strs.forEach((str, i) => {
    text = `${text}${str}${
      typeof params[i] === 'number' ? 'n' : params[i] || ''
    }`
  })
  const key = snakeCase(normalize(text))
  let translation
  const textTranslations = translations[key]
  if (textTranslations) {
    translation =
      plural && textTranslations.length === 2
        ? textTranslations[1]
        : Array.isArray(textTranslations)
        ? textTranslations[0]
        : textTranslations
  } else {
    translation = text
  }
  if (requirePlural) {
    translation = translation.replace('*', params[0])
  }
  return translation
}

export default t
