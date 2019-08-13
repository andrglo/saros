// inspired by https://usehooks.com/useOnClickOutside/
import {useEffect} from 'react'

const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const refs = Array.isArray(ref) ? ref : [ref]
    const listener = event => {
      for (const ref of refs) {
        let current
        if ('current' in ref) {
          current = ref.current
        } else {
          current = ref
        }
        if (!current || current.contains(event.target)) {
          return
        }
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

export default useOnClickOutside
