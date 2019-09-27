import test from 'ava'
import {getStartOfMonth, getEndOfMonth} from '../date'

test('Get start of month', test => {
  const result = getStartOfMonth('2019-09-27')
  test.log(result)
  test.is(result, '2019-09-01')
})

test('Get end of month', test => {
  const result = getEndOfMonth('2019-09-27')
  test.log(result)
  test.is(result, '2019-09-30')
})
