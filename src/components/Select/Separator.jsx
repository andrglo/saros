/* eslint-disable react/prop-types */
import React from 'react'

const Separator = ({props, state, methods}) =>
  props.separatorRenderer ? (
    props.separatorRenderer({props, state, methods})
  ) : (
    <div
      style={{
        display: 'block',
        width: 1
      }}
      className={`...-separator`}
    />
  )

export default Separator
