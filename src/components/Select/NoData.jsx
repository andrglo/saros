/* eslint-disable react/prop-types */
import React from 'react'

const NoData = ({props, state, methods}) =>
  props.noDataRenderer ? (
    props.noDataRenderer({props, state, methods})
  ) : (
    <div className={`...-no-data`} color={props.color}>
      {props.noDataLabel}
    </div>
  )

export default NoData
