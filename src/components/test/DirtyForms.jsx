import React from 'react'

import {
  cleanup,
  fireEvent,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import test from 'ava'

import render from '../../../test/lib/renderWithRedux'
import DirtyFormsButton from '../DirtyForms'

const MINUTE = 60000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

test.afterEach(cleanup)

test('Select in a form', t => {
  // eslint-disable-next-line no-unused-vars
  const {container, debug, rerender, queryByText} = render(
    <DirtyFormsButton />,
    {
      initialState: {
        forms: {
          f1: {
            formName: 'form1',
            dirty: true,
            pathname: '/f1',
            createdAt: Date.now() - MINUTE - 1
          },
          f2: {
            formName: 'form2'
          },
          f3: {
            formName: 'form3',
            dirty: true,
            pathname: '/f3',
            createdAt: Date.now() - HOUR - 1
          },
          f4: {
            formName: 'form4',
            dirty: true,
            pathname: '/f4',
            createdAt: Date.now() - DAY - 1
          },
          f5: {
            formName: 'form5',
            dirty: true,
            pathname: '/f5',
            createdAt: Date.now() - 1
          },
          f6: {
            formName: 'form6',
            dirty: true,
            pathname: '/f6'
          }
        }
      }
    }
  )
  t.is(document.body.childNodes.length, 1)
  const badge = container.querySelector('span')
  t.is(badge.textContent, '5')

  const button = container.querySelector('button')
  fireEvent.click(button)

  const ul = container.querySelector('ul')
  t.is(ul.childNodes.length, 5)

  t.truthy(queryByText('Form 1'))
  t.falsy(queryByText('Form 2'))
  t.truthy(queryByText('Form 3'))
  t.truthy(queryByText('Form 4'))
  t.truthy(queryByText('Form 5'))
  t.truthy(queryByText('Form 6'))
})
