import {LocalDate, YearMonth, TemporalAdjusters} from '@js-joda/core'

export const isYearMonth = date => date && date.length === 7
export const extractYearMonth = date => date && date.substring(0, 7)
export const today = () => LocalDate.now().toString()

export const toYearMonth = date => {
  let result
  try {
    result = date
      ? YearMonth.parse(
          date.length === 7 ? date : date.substring(0, 7)
        )
      : YearMonth.now()
    result = result.toString()
  } catch (err) {
    console.error('toYearMonth', date, err)
    result = YearMonth.now().toString()
  }
  return result
}

export const addMonths = (date, months) => {
  try {
    date = date || today()
    if (isYearMonth(date)) {
      date = YearMonth.parse(date)
        .plusMonths(months)
        .toString()
    } else {
      date = LocalDate.parse(date)
        .plusMonths(months)
        .toString()
    }
  } catch (err) {
    console.error('addMonths', date, err)
  }
  return date
}

export const startOfMonth = date => {
  try {
    date = date ? LocalDate.parse(date) : LocalDate.now()
    date = date.with(TemporalAdjusters.firstDayOfMonth()).toString()
  } catch (err) {
    console.error('startOfMonth', date, err)
  }
  return date
}

export const endOfMonth = date => {
  try {
    date = date ? LocalDate.parse(date) : LocalDate.now()
    date = date.with(TemporalAdjusters.lastDayOfMonth()).toString()
  } catch (err) {
    console.error('endOfMonth', date, err)
  }
  return date
}
