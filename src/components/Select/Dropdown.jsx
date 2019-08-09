/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React from 'react'
import cn from 'classnames'

import NoData from './NoData'
import Item from './Item'

import {valueExistInSelected} from './util'

const dropdownPosition = (props, methods) => {
  const ref = methods.getSelectRef()
  if (!ref) {
    return 'bottom'
  }
  const DropdownBoundingClientRect = ref.getBoundingClientRect()
  const dropdownHeight =
    DropdownBoundingClientRect.bottom +
    parseInt(props.dropdownHeight, 10) +
    parseInt(props.dropdownGap, 10)

  if (props.dropdownPosition !== 'auto') {
    return props.dropdownPosition
  }

  if (
    dropdownHeight > window.innerHeight &&
    dropdownHeight > DropdownBoundingClientRect.top
  ) {
    return 'top'
  }

  return 'bottom'
}

const Dropdown = ({classes, props, state, methods}) => {
  const {dropdownGap, dropdownHeight, portal} = props
  const {selectBounds} = state
  const style = {
    position: 'absolute',
    width: selectBounds.width,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: dropdownHeight,
    overflow: 'auto',
    zIndex: 9
  }
  if (portal) {
    style.position = 'fixed'
    style.top = (selectBounds.bottom || 0) + dropdownGap
    style.left = selectBounds.left || 0
  } else {
    style.left = -1
    if (dropdownPosition(props, methods) === 'top') {
      style.bottom = selectBounds.height + 2 + dropdownGap
    } else {
      style.top = selectBounds.height + 2 + dropdownGap
    }
  }

  return (
    <div
      style={style}
      className={classes.dropdown}
      tabIndex="-1"
      aria-expanded="true"
      role="list"
    >
      {props.dropdownRenderer ? (
        props.dropdownRenderer({props, state, methods})
      ) : (
        <React.Fragment>
          {props.create &&
            state.search &&
            !valueExistInSelected(state.search, props) && (
              <div
                className={classes['add-new']}
                color={props.color}
                onClick={() => methods.createNew(state.search)}
              >
                {props.createNewLabel.replace(
                  '{search}',
                  `"${state.search}"`
                )}
              </div>
            )}
          {methods.searchResults().length === 0 ? (
            <NoData
              className={classes['no-data']}
              state={state}
              props={props}
              methods={methods}
            />
          ) : (
            methods
              .searchResults()
              .map((item, itemIndex) => (
                <Item
                  key={item[props.valueField]}
                  classes={classes}
                  item={item}
                  itemIndex={itemIndex}
                  state={state}
                  props={props}
                  methods={methods}
                />
              ))
          )}
        </React.Fragment>
      )}
    </div>
  )
}

export default Dropdown
