/* eslint-disable react/prop-types */
import React from 'react'

const Loading = ({props}) =>
  props.loadingRenderer ? (
    props.loadingRenderer({props})
  ) : (
    <div className={`...-loading`} color={props.color} />
  )

export default Loading
