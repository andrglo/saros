import snakeCase from 'lodash/snakeCase'
import axios from 'axios'
import normalize from './normalize'

let translations = {}

let currentLocale

export const getCurrentLocale = () => currentLocale

export const fetchLocale = locale =>
  axios
    .get(`/locale/${locale}.json`, {
      baseURL: null
    })
    .then(result => {
      setTranlations(result.data)
      currentLocale = locale
      return true // changed
    })
    .catch(err => {
      locale = null
      console.error(err)
    })

export const setTranlations = newTranslations => {
  translations = newTranslations
}

const t = (strs, ...params) => {
  const requirePlural = typeof params[0] === 'number'
  const plural = requirePlural && Number(params[0]) > 1
  let text = ``
  strs = Array.isArray(strs) ? strs : [strs]
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
