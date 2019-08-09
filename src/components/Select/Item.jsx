import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import {getByPath} from './util'

class Item extends Component {
  constructor(props) {
    super(props)

    this.item = React.createRef()
  }

  componentDidUpdate() {
    if (
      this.props.state.cursor === this.props.itemIndex &&
      this.item.current
    ) {
      this.item.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      })
    }
  }

  render() {
    const {
      props,
      state,
      methods,
      item,
      itemIndex,
      classes
    } = this.props

    if (props.itemRenderer) {
      return props.itemRenderer({
        classes,
        item,
        itemIndex,
        props,
        state,
        methods
      })
    }

    if (!props.keepSelectedInList && methods.isSelected(item)) {
      return null
    }

    const style = {
      cursor: 'pointer'
    }

    return (
      <span
        className={cn(classes.item, {
          [classes['item-selected']]: methods.isSelected(item),
          [classes['item-active']]: state.cursor === itemIndex,
          [classes['item-disabled']]: item.disabled
        })}
        role="option"
        style={style}
        ref={this.item}
        aria-selected={methods.isSelected(item)}
        aria-disabled={item.disabled}
        disabled={item.disabled}
        aria-label={getByPath(item, props.labelField)}
        key={`${getByPath(item, props.valueField)}${getByPath(
          item,
          props.labelField
        )}`}
        tabIndex="-1"
        onClick={
          item.disabled ? undefined : () => methods.addItem(item)
        }
        onKeyPress={
          item.disabled ? undefined : () => methods.addItem(item)
        }
      >
        {getByPath(item, props.labelField)}{' '}
        {item.disabled && <ins>{props.disabledLabel}</ins>}
      </span>
    )
  }
}

Item.propTypes = {
  classes: PropTypes.object,
  props: PropTypes.any,
  state: PropTypes.any,
  methods: PropTypes.any,
  item: PropTypes.any,
  itemIndex: PropTypes.any
}

export default Item
