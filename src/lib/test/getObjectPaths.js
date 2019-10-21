import test from 'ava'
import getObjectPaths from '../getObjectPaths'

test('Get paths from a invalid object', test => {
  const result = getObjectPaths()
  test.log(result)
  test.deepEqual(result, [])
})

test('Get paths from a empty object', test => {
  const result = getObjectPaths({})
  test.log(result)
  test.deepEqual(result, [])
})

test('Get paths from a complex object', test => {
  const result = getObjectPaths({
    a: {
      b: 1,
      c: 2,
      d: [1, 2, 3]
    },
    e: [{f: 1}, {g: 2}]
  })
  test.log(result)
  test.deepEqual(result, [
    'a.b',
    'a.c',
    'a.d.0',
    'a.d.1',
    'a.d.2',
    'e.0.f',
    'e.1.g'
  ])
})
