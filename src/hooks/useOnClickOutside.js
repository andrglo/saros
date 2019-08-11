// inspired by https://usehooks.com/useOnClickOutside/
import {useEffect} from 'react'

const useOnClickOutside = (domNode, handler) => {
  useEffect(() => {
    const domNodes = Array.isArray(domNode) ? domNode : [domNode]
    const listener = event => {
      for (const domNode of domNodes) {
        if (!domNode || domNode.contains(event.target)) {
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
  }, [domNode, handler])
}

export default useOnClickOutside
