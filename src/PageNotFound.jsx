import React from 'react'
import t from './lib/translate'

const PageNotFound = () => {
  return (
    <div className="w-full pt-5 text-center">
      <p className="text-warning italic font-bold text-2xl">{t`Page not found`}</p>
    </div>
  )
}

export default PageNotFound
