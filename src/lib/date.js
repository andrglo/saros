import {
  LocalDate,
  YearMonth,
  TemporalAdjusters,
  DayOfWeek,
  ChronoField,
  ChronoUnit
} from '@js-joda/core'
import easter from 'date-easter'

import {getCurrentLocale} from './translate'

export const isYearMonth = date => date && date.length === 7
export const extractYearMonth = date => date && date.substring(0, 7)
export const extractYear = date => date && date.substring(0, 4)
export const getCurrentDate = () => LocalDate.now().toString()
export const getCurrentMonth = () => YearMonth.now().toString()

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

export const addYears = (date, years) => {
  try {
    date = date || getCurrentDate()
    if (isYearMonth(date)) {
      date = YearMonth.parse(date)
        .plusYears(years)
        .toString()
    } else {
      date = LocalDate.parse(date)
        .plusYears(years)
        .toString()
    }
  } catch (err) {
    console.error('addYears', {date, years}, err)
  }
  return date
}

export const addMonths = (date, months) => {
  try {
    date = date || getCurrentDate()
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
    date = date || getCurrentDate()
    date = LocalDate.parse(date)
      .plusDays(days)
      .toString()
  } catch (err) {
    console.error('addDays', {date, days}, err)
  }
  return date
}

export const addWeeks = (date, weeks) => {
  try {
    date = date || getCurrentDate()
    date = LocalDate.parse(date)
      .plusWeeks(weeks)
      .toString()
  } catch (err) {
    console.error('addWeeks', {date, weeks}, err)
  }
  return date
}

export const getStartOfMonth = date => {
  try {
    date = date ? LocalDate.parse(date) : LocalDate.now()
    date = date.with(TemporalAdjusters.firstDayOfMonth()).toString()
  } catch (err) {
    console.error('getStartOfMonth', date, err)
  }
  return date
}

export const getEndOfMonth = date => {
  try {
    date = date ? LocalDate.parse(date) : LocalDate.now()
    date = date.with(TemporalAdjusters.lastDayOfMonth()).toString()
  } catch (err) {
    console.error('getEndOfMonth', date, err)
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

export const setDayOfWeek = (yearMonth, dayOfWeek) => {
  let date
  try {
    date = yearMonth
      ? isYearMonth(yearMonth)
        ? LocalDate.parse(yearMonth + '-01')
        : LocalDate.parse(yearMonth)
      : LocalDate.now()
    date = date
      .withFieldAndValue(ChronoField.DAY_OF_WEEK, Number(dayOfWeek))
      .toString()
  } catch (err) {
    console.error('setDayOfWeek', {yearMonth, dayOfWeek}, err)
    date = null
  }
  return date
}

export const setDayOfMonth = (yearMonth, day) => {
  let date
  try {
    date = yearMonth
      ? isYearMonth(yearMonth)
        ? LocalDate.parse(yearMonth + '-01')
        : LocalDate.parse(yearMonth)
      : LocalDate.now()
    const lengthOfMonth = date.lengthOfMonth()
    day = Number(day)
    date = date
      .withDayOfMonth(day < lengthOfMonth ? day : lengthOfMonth)
      .toString()
  } catch (err) {
    console.error('setDayOfMonth', {yearMonth, day}, err)
    date = null
  }
  return date
}

export const setMonthAndDayOfMonth = (year, month, day) => {
  let date
  try {
    year = typeof year === 'string' ? extractYear(year) : year
    date = year
      ? LocalDate.of(Number(year), Number(month), 1)
      : LocalDate.now()
    const lengthOfMonth = date.lengthOfMonth()
    day = Number(day)
    date = date
      .withDayOfMonth(day < lengthOfMonth ? day : lengthOfMonth)
      .toString()
  } catch (err) {
    console.error('setMonthAndDayOfMonth', {year, month, day}, err)
    date = null
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
    console.error('isWeekEnd', date, err)
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

export const getMonthsUntil = (from, to) => {
  let interval = -1
  try {
    from = YearMonth.parse(extractYearMonth(from))
    to = YearMonth.parse(extractYearMonth(to))
    interval = from.until(to, ChronoUnit.MONTHS)
  } catch (err) {
    console.error('getMonthsUntil', from, to, err)
  }
  return interval
}

export const getWeeksUntil = (from, to) => {
  let interval = -1
  try {
    from = LocalDate.parse(from)
    to = LocalDate.parse(to)
    interval = from.until(to, ChronoUnit.WEEKS)
  } catch (err) {
    console.error('getWeeksUntil', from, to, err)
  }
  return interval
}

export const toDateString = (date, options = {}) =>
  new Date(`${date}T00:00`).toLocaleDateString(
    getCurrentLocale(),
    options
  )
