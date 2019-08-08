// inspired in https://usehooks.com/useKeyPress/
import {useEffect} from 'react'

const useKeyPress = (targetKey, handler) => {
  useEffect(() => {
    const downHandler = ({key}) => {
      if (key === targetKey) {
        handler(key)
      }
    }
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [handler, targetKey])
}

export default useKeyPress
