import {useEffect, useState} from 'react'
import useEventListener from './useEventListener'
import getScrollParent from '../lib/getScrollParent'

const useBounds = ref => {
  const [bounds, setBounds] = useState()
  const node = ref && 'current' in ref ? ref.current : ref
  const updateBounds = () => {
    if (node) {
      setBounds(node.getBoundingClientRect())
    }
  }
  useEffect(updateBounds, [node])
  useEventListener('resize', updateBounds)
  useEventListener('scroll', updateBounds, getScrollParent(node))
  return bounds
}

export default useBounds
