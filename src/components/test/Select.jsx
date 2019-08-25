import React from 'react'
import {cleanup, render} from '@testing-library/react'
import testRenderer from 'react-test-renderer'
import test from 'ava'

import Select from '../Select'

test.afterEach(cleanup)

test('Select snapshot', t => {
  const component = testRenderer
    .create(
      <Select
        options={[{label: '1', value: 1}, {label: '2', value: 2}]}
        onChange={() => {}}
      />
    )
    .toJSON()
  t.log('component', component)
  t.snapshot(component)
})

test('Select behavior', t => {
  const {container} = render(
    <Select
      options={[{label: '1', value: 1}, {label: '2', value: 2}]}
      onChange={() => {}}
    />
  )
  const select = container.querySelector('[role=combobox]')
  t.is(Boolean(select), true)
  t.pass()
})
