import {getCurrentLocale} from './translate'

export const formatNumber = (number, decimals = 0) =>
  Number(number || 0).toLocaleString(getCurrentLocale(), {
    minimumFractionDigits: decimals
  })

export const formatCurrency = (
  number,
  {absolute = true, integer = true} = {}
) => {
  number = integer ? number / 100 : number
  number = absolute ? Math.abs(number) : number
  return formatNumber(number, 2)
}
