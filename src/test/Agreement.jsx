import React from 'react'

import {
  render,
  cleanup,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import test from 'ava'

import Agreement from '../Agreement'

test.afterEach(cleanup)

test('Agreement instace creation', t => {
  // eslint-disable-next-line no-unused-vars
  const {container, debug, rerender, queryByText} = render(
    <Agreement />
  )
  t.is(container.childNodes.length, 1)
})
