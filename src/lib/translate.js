import snakeCase from 'lodash/snakeCase'
import normalize from './normalize'

let translations = {}

export const setTranlations = newTranslations => {
  translations = newTranslations
}

const t = (strs, ...params) => {
  const requirePlural = typeof params[0] === 'number'
  const plural = requirePlural && Number(params[0]) > 1
  let key = ``
  strs.forEach((str, i) => {
    key = `${key}${str}${
      typeof params[i] === 'number' ? 'n' : params[i] || ''
    }`
  })
  key = snakeCase(normalize(key))
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
    translation = key
  }
  if (requirePlural) {
    translation = translation.replace('*', params[0])
  }
  return translation
}

export default t
