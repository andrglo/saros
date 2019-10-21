export default obj => {
  const keys = []
  const traverse = (obj, root = '') => {
    for (const key of Object.keys(obj || {})) {
      const path = `${root ? `${root}.` : ''}${key}`
      if (obj[key] !== null && typeof obj[key] === 'object') {
        traverse(obj[key], path)
      } else {
        keys.push(path)
      }
    }
  }
  traverse(obj)
  return keys
}
