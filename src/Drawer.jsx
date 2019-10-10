import React from 'react'
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types'
import {hot} from 'react-hot-loader/root'
import debug from 'debug'

import Version from './components/Version'

import BalancePanel from './components/BalancePanel'

// eslint-disable-next-line no-unused-vars
const log = debug('drawer')

const Drawer = () => {
  // log('render', props)
  return (
    <React.Fragment>
      <Version />
      <BalancePanel className="pt-4 pr-1" />
    </React.Fragment>
  )
}

Drawer.propTypes = {}

export default hot(Drawer)
