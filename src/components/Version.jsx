import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import {version, revision} from '../loaders/version!'
import t from '../lib/translate'

const Version = props => {
  const {className} = props
  return (
    <p className={cn('version float-right mr-1', className)}>
      {t`Version` + `: ${version}-${revision.substring(0, 3)}`}
    </p>
  )
}

Version.propTypes = {
  className: PropTypes.string
}

export default Version
