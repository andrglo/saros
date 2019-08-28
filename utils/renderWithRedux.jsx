// from https://testing-library.com/docs/example-react-redux
import React from 'react'
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import {render} from '@testing-library/react'

const renderWithRedux = (
  ui,
  {initialState = {}, reducer = state => state} = {}
) => {
  const store = createStore(reducer, initialState)
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store
  }
}

export default renderWithRedux
