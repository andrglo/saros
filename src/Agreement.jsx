/* eslint-disable react/jsx-no-undef */
import React from 'react'
import /* codegen('../assets/agreement.md') */ './loaders/markdown'

const Agreement = () => {
  return (
    <div className="p-4 bg-gray-200 text-gray-900 h-screen w-screen">
      <Markdown />
    </div>
  )
}

export default Agreement
