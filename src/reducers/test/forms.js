import test from 'ava'
import util from 'util'
import formsReducers, {mergeDocInFormValues} from '../forms'

// eslint-disable-next-line no-unused-vars
const log = (caption, data) => {
  console.log(caption, util.inspect(data, {depth: null}))
}

const formName = 'test'

test('Merge values into pristine form', t => {
  const reducer = formsReducers.handlers[mergeDocInFormValues]
  const doc = {
    name: 'andre',
    children: [{name: 'ana'}, {name: 'joe'}]
  }
  const pristineForm = {
    initialValues: {},
    values: {},
    descriptionFields: [''],
    dirty: false,
    changedByUser: [],
    fieldErrors: {}
  }
  const form = reducer(
    {[formName]: pristineForm},
    mergeDocInFormValues({
      formName,
      doc
    })
  )
  // log('form', form[formName])
  t.deepEqual(form[formName], {
    ...pristineForm,
    values: doc,
    initialValues: doc
  })
})

test('Merge values into dirty form', t => {
  const reducer = formsReducers.handlers[mergeDocInFormValues]
  const values = {
    name: 'Mary',
    age: 20,
    height: 5.7,
    phones: [
      {
        number: '11'
      },
      {
        number: '1'
      },
      {
        number: '2'
      },
      {
        number: '3'
      },
      {
        number: '44'
      }
    ]
  }
  const refreshedValues = {
    name: 'Maryann',
    age: 20,
    height: 3,
    phones: [
      {
        number: '111'
      },
      {
        number: '2'
      },
      {
        number: '3'
      },
      {
        number: '33'
      },
      {
        number: '44'
      },
      {
        number: '5'
      }
    ]
  }
  const previousState = {
    [formName]: {
      initialValues: {}, // irrelevant in this test
      values,
      descriptionFields: [''],
      dirty: true,
      changedByUser: [
        'height',
        'phones',
        'phones.0.number',
        'phones.4.number'
      ],
      fieldErrors: {'phones.4.number': 'err'}
    }
  }
  const state = reducer(
    previousState,
    mergeDocInFormValues({
      formName,
      doc: refreshedValues
    })
  )
  // log('form', state[formName])
  t.truthy(state[formName].values !== previousState[formName].values)
  t.deepEqual(state[formName].initialValues, refreshedValues)
  t.truthy(state[formName].initialValues !== refreshedValues)
  t.deepEqual(state[formName].values, {
    name: 'Maryann',
    age: 20,
    height: 5.7,
    phones: [
      {
        number: '11'
      },
      {
        number: '2'
      },
      {
        number: '3'
      },
      {
        number: '33'
      },
      {
        number: '44'
      },
      {
        number: '5'
      }
    ]
  })
  // log('form.fieldErrors', state[formName].fieldErrors)
  t.deepEqual(state[formName].fieldErrors, {
    height: 'Update conflict, now is "3"',
    'phones.0.number': 'Update conflict, now is "111"'
  })
  // log('form.changedByUser', state[formName].changedByUser)
  t.deepEqual(state[formName].changedByUser, [
    'height',
    'phones',
    'phones.0.number'
  ])
})
