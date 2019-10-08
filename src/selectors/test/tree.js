import test from 'ava'
import {getHierarchy} from '../tree'

test('Get hierarchy from a tree data structure', t => {
  const tree = {
    root: {
      children: ['a']
    },
    a: {
      children: ['a1']
    },
    a1: {
      children: ['a1a']
    },
    a1a: {}
  }
  let hierarchy = getHierarchy('a1', tree)
  t.deepEqual(hierarchy, ['a', 'root'])
  hierarchy = getHierarchy('a', tree)
  t.deepEqual(hierarchy, ['root'])
  hierarchy = getHierarchy('a')
  t.deepEqual(hierarchy, undefined)
  hierarchy = getHierarchy('a1a', tree)
  t.deepEqual(hierarchy, ['a1', 'a', 'root'])
})
