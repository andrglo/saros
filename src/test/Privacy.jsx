import React from 'react'

import {
  render,
  cleanup,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import test from 'ava'

import Privacy from '../Privacy'

test.afterEach(cleanup)

test('Privacy instace creation', t => {
  // eslint-disable-next-line no-unused-vars
  const {container, debug, rerender, queryByText} = render(
    <Privacy />
  )
  t.is(container.childNodes.length, 1)
})
