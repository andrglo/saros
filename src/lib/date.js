import {
  LocalDate,
  YearMonth,
  TemporalAdjusters,
  DayOfWeek
} from '@js-joda/core'
import easter from 'date-easter'

export const isYearMonth = date => date && date.length === 7
export const extractYearMonth = date => date && date.substring(0, 7)
export const extractYear = date => date && date.substring(0, 4)
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
    console.error('addMonths', {date, months}, err)
  }
  return date
}

export const addDays = (date, days) => {
  try {
    date = date || today()
    date = LocalDate.parse(date)
      .plusDays(days)
      .toString()
  } catch (err) {
    console.error('addDays', {date, days}, err)
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

export const getLengthOfMonth = date => {
  let lengthOfMonth = 30
  try {
    date = date
      ? isYearMonth(date)
        ? YearMonth.parse(date)
        : LocalDate.parse(date)
      : LocalDate.now()
    lengthOfMonth = date.lengthOfMonth()
  } catch (err) {
    console.error('getLengthOfMonth', date, err)
  }
  return lengthOfMonth
}

export const setDayOfMonth = (month, day) => {
  let date
  try {
    date = month
      ? isYearMonth(month)
        ? LocalDate.parse(month + '-01')
        : LocalDate.parse(month)
      : LocalDate.now()
    date = date.withDayOfMonth(day).toString()
  } catch (err) {
    console.error('setDayOfMonth', {month, day}, err)
  }
  return date
}

export const isWeekEnd = date => {
  try {
    const dayOfWeek = LocalDate.parse(date).dayOfWeek()
    return (
      dayOfWeek.equals(DayOfWeek.SATURDAY) ||
      dayOfWeek.equals(DayOfWeek.SUNDAY)
    )
  } catch (err) {
    console.error('getDayOfWeek', date, err)
  }
}

export const getEasterDate = year => {
  try {
    const easterDate = easter.easter(year)
    return LocalDate.of(
      easterDate.year,
      easterDate.month,
      easterDate.day
    ).toString()
  } catch (err) {
    console.error('getEasterDate', year, err)
  }
}
