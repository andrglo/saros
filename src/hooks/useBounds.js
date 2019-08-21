import {useEffect, useState} from 'react'
import useEventListener from './useEventListener'
import getScrollParent from '../lib/getScrollParent'

const useBounds = ref => {
  const [bounds, setBounds] = useState()
  const node = ref && 'current' in ref ? ref.current : ref
  const {left, right, top, bottom, width, height} =
    (node && node.getBoundingClientRect()) || {}
  useEffect(() => {
    setBounds({left, right, top, bottom, width, height})
  }, [bottom, height, left, node, right, top, width])

  const updateBounds = () => {
    if (node) {
      setBounds(node.getBoundingClientRect())
    }
  }
  useEventListener('resize', updateBounds)
  useEventListener('scroll', updateBounds, getScrollParent(node))
  return bounds
}

export default useBounds
