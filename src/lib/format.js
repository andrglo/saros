import {getCurrentLocale} from './translate'

export const formatNumber = (number, decimals = 0) =>
  Number(number || 0).toLocaleString(getCurrentLocale(), {
    minimumFractionDigits: decimals
  })

export const formatCurrency = number => formatNumber(number, 2)
