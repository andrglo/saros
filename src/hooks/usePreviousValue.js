// inspired in https://usehooks.com/usePrevious/
import {useEffect, useRef} from 'react'

const usePreviousValue = value => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export default usePreviousValue
