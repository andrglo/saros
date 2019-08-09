import test from 'ava'
import extractClassesByComponent from '../extractClassesByComponent'

test('only default class', test => {
  const result = extractClassesByComponent('bg-input')
  test.log(result)
  test.deepEqual(result, {container: 'bg-input'})
  test.pass()
})

test('with three classes', test => {
  const result = extractClassesByComponent(`
      bg-input hover:bg-highlight-input border hover:border-highlight
      placeholder-input block w-full text-base rounded-sm
      appearance-none py-1 px-1 leading-tight
      dropdown {}
      focus:outline-none focus:shadow-outline
      clear {
      focus:outline-none focus:shadow-outline
      }123 input-single { py-1 px-1 leading-side}
      abc
  `)
  test.log(result)
  test.deepEqual(result, {
    container:
      'bg-input hover:bg-highlight-input border hover:border-highlight placeholder-input block w-full text-base rounded-sm appearance-none py-1 px-1 leading-tight focus:outline-none focus:shadow-outline 123 abc',
    clear: 'focus:outline-none focus:shadow-outline',
    'input-single': 'py-1 px-1 leading-side',
    dropdown: ''
  })
  test.pass()
})
