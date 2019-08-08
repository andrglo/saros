// inspired by https://usehooks.com/useMedia/
import {useEffect} from 'react'

const useMedia = (query, value, setValue) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = () => {
      if (mediaQuery.matches) {
        setValue(value)
      }
    }
    handler()
    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }, [query, value, setValue])
}

export default useMedia
