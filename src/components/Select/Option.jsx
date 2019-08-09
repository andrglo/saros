/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react'
import {getByPath} from './util'

const Option = ({item, props, state, methods}) =>
  item && props.optionRenderer ? (
    props.optionRenderer({item, props, state, methods})
  ) : (
    <span
      role="listitem"
      style={{
        display: 'flex',
        flexDirection:
          props.direction === 'rtl' ? 'row-reverse' : 'row'
      }}
      disabled={props.disabled}
      className={`...-option`}
    >
      <span className={`...-option-label`}>
        {getByPath(item, props.labelField)}
      </span>
      <span
        className={`...-option-remove`}
        onClick={event =>
          methods.removeItem(event, item, props.closeOnSelect)
        }
      >
        &times;
      </span>
    </span>
  )

export default Option
