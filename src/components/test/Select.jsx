import React, {useState} from 'react'
import PropTypes from 'prop-types'

import {
  cleanup,
  render,
  fireEvent,
  // eslint-disable-next-line no-unused-vars
  prettyDOM
} from '@testing-library/react'
import test from 'ava'

import Select from '../Select'

test.afterEach(cleanup)

const Form = props => {
  const {courseProps = {}} = props
  const [teacher, setTeacher] = useState('2')
  const [course, setCourse] = useState('')
  return (
    <form onSubmit={() => {}}>
      <Select
        id="teacher"
        options={[
          {label: 'John', value: 1},
          {label: 'Martha', value: 2},
          {label: 'Kia', value: 3}
        ]}
        value={teacher}
        onChange={setTeacher}
      />
      <Select
        id="course"
        options={[
          {label: 'Math', value: 'mth'},
          {label: 'Geography', value: 'geo'},
          {label: 'Geography 2', value: 'geo2'},
          {label: 'Geography 3', value: 'geo3'},
          {label: 'Geography 4', value: 'geo4'}
        ]}
        allowAnyValue
        value={course}
        onChange={setCourse}
        {...courseProps}
      />
      <button type="submit">Submit</button>
    </form>
  )
}

Form.propTypes = {
  courseProps: PropTypes.object
}

test('Select in a form', t => {
  // eslint-disable-next-line no-unused-vars
  const {container, debug, rerender} = render(<Form />)

  t.is(document.body.childNodes.length, 1, 'Invalid portal')
  const teacher = container.querySelector('[id=teacher]')
  let input = teacher.querySelector('input')

  fireEvent.click(input)
  t.is(document.body.childNodes.length, 2, 'Portal not created')
  let ul = document.body.childNodes[1].querySelector('ul')
  t.is(ul.childNodes.length, 3)
  let focused = ul.querySelector('.bg-menu-focused')
  t.is(focused.textContent, 'Martha')
  let selected = ul.querySelector('.bg-menu-selected')
  t.is(selected, null)

  fireEvent.keyDown(input, {key: 'ArrowDown'})
  fireEvent.keyDown(input, {key: 'ArrowUp'})
  fireEvent.keyDown(input, {key: 'ArrowDown'})
  focused = ul.querySelector('.bg-menu-focused')
  t.is(focused.textContent, 'Kia')
  selected = ul.querySelector('.bg-menu-selected')
  t.is(selected.textContent, 'Martha')

  fireEvent.keyDown(input, {key: 'Enter'})
  t.is(
    document.body.childNodes.length,
    1,
    'Invalid portal after Enter'
  )
  t.is(input.value, '')
  let spans = teacher.querySelectorAll('span')
  t.is(spans.length, 1)
  t.is(spans[0].textContent, 'Kia')
  t.is(container.querySelector(':focus'), input)

  const course = container.querySelector('[id=course]')
  input = course.querySelector('input')
  fireEvent.click(input) // fireEvent keyPress with Tab only works in a browser
  t.is(document.activeElement === input, true)
  t.is(document.body.childNodes.length, 2, 'Portal not created')

  ul = document.body.childNodes[1].querySelector('ul')
  t.is(ul.childNodes.length, 5)
  focused = ul.querySelector('.bg-menu-focused')
  t.is(focused.textContent, 'Math')
  selected = ul.querySelector('.bg-menu-selected')
  t.is(selected, null)
  fireEvent.change(input, {target: {value: 'g'}})
  t.is(input.value, 'g')
  t.is(ul.childNodes.length, 4)
  focused = ul.querySelector('.bg-menu-focused')
  t.is(focused.textContent, 'Geography')

  fireEvent.change(input, {target: {value: 'ghy'}})
  t.is(input.value, 'ghy')
  t.is(ul.childNodes.length, 1)
  t.is(ul.childNodes[0].textContent, 'No options available')

  input = teacher.querySelector('input')
  fireEvent.mouseDown(input)
  fireEvent.click(input)
  t.is(
    document.body.childNodes.length,
    2,
    'Portal not created or previous not destroyed'
  )
  input = course.querySelector('input')
  t.is(input.value, 'ghy')
  rerender(
    <Form
      courseProps={{
        options: [{label: 'Other', value: 'ghy'}]
      }}
    />
  )
  t.is(input.value, '')
  spans = course.querySelectorAll('span')
  t.is(spans.length, 1)
  t.is(spans[0].textContent, 'Other')

  const button = course.querySelector('button')
  fireEvent.mouseDown(button)
  fireEvent.click(button)
  t.is(document.body.childNodes.length, 2)
  ul = document.body.childNodes[1].querySelector('ul')
  t.is(ul.childNodes.length, 1)
  fireEvent.click(button)
  t.is(document.body.childNodes.length, 1)
  fireEvent.click(button)
  t.is(document.body.childNodes.length, 2)
  fireEvent.keyDown(input, {key: 'Escape'})
  t.is(document.body.childNodes.length, 1)
})
