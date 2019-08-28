import React from 'react'

import {
  cleanup,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import test from 'ava'

import render from '../../../utils/renderWithRedux'
import DirtyForms from '../DirtyForms'

test.afterEach(cleanup)

test('Select in a form', t => {
  // eslint-disable-next-line no-unused-vars
  const {container, debug, rerender} = render(<DirtyForms />, {
    initialState: {
      forms: {
        f1: {
          dirty: true,
          pathname: '/edit'
        },
        f2: {}
      }
    }
  })
  t.is(document.body.childNodes.length, 1)
  const badge = container.querySelector('p')
  t.is(badge.textContent, '1')
})
