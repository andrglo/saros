import {LocalDate, YearMonth, TemporalAdjusters} from '@js-joda/core'

export const toYearMonth = date => {
  let result
  try {
    result = date
      ? YearMonth.parse(
          date.length === 7 ? date : date.substring(0, 7)
        )
      : YearMonth.now()
  } catch (err) {
    console.error('toYearMonth', date, err)
    result = YearMonth.now()
  }
  return result
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

export const today = () => LocalDate.now().toString()
