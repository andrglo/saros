import {
  LocalDate,
  YearMonth,
  TemporalAdjusters,
  DayOfWeek
} from '@js-joda/core'
import {defaultMemoize as memoize} from 'reselect'
import calcEasterDate from 'date-easter'

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
    console.error('addMonths', {date, months}, err)
  }
  return date
}

export const addDays = (date, days) => {
  try {
    date = date || today()
    date = LocalDate.parse(date)
      .plusMonths(days)
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
    date = date
      ? isYearMonth(date)
        ? LocalDate.parse(date + '-01')
        : LocalDate.parse(date)
      : LocalDate.now()
    date = date.withDayOfMonth(day).toString()
  } catch (err) {
    console.error('setDayOfMonth', {month, day}, err)
  }
  return date
}

const getYearHolidays = memoize((holidays, year) => {
  const yearHolidays = {}
  for (const region of Object.keys(holidays)) {
    const days = holidays[region]
    for (const monthDay of Object.keys(days)) {
      let date
      const match = monthDay.match(/^easter([+-]\d+)$/)
      if (match) {
        const ester = calcEasterDate.easter(year)
        date = LocalDate.now()
          .withYear(ester.year)
          .withMonth(ester.month)
          .withDayOfMonth(ester.day)
          .plusDays(Number(match.match(1)))
          .toString()
      } else {
        date = `${year}-${monthDay}`
      }
      yearHolidays[date] = days[monthDay]
    }
  }
  return yearHolidays
})

export const isBusinessDay = (date, region, holidays) => {
  try {
    const dayOfWeek = LocalDate.parse(date).dayOfWeek()
    if (
      dayOfWeek.equals(DayOfWeek.SATURDAY) ||
      dayOfWeek.equals(DayOfWeek.SUNDAY)
    ) {
      return false
    }
    const yearHolidays = getYearHolidays(holidays, date.year())
    const {country, state, city} = region
    if ((yearHolidays[country] || {})[date]) {
      return false
    }
    if ((yearHolidays[`${country}/${state}`] || {})[date]) {
      return false
    }
    if ((yearHolidays[`${country}/${state}/${city}`] || {})[date]) {
      return false
    }
  } catch (err) {
    console.error('isBusinessDay', {date, region, holidays}, err)
  }
  return true
}
