const regex = /([\w-]+) ?\{([^}]*)\}/g

export default className => {
  const result = {container: ''}
  className = className
    .trim()
    .split('\n')
    .map(str => str.trim())
    .join(' ')
  let match = regex.exec(className)
  let index = 0
  while (match) {
    result[match[1]] = match[2].trim()
    result.container += className
      .substring(index, match.index)
      .trimStart()
    index = regex.lastIndex
    match = regex.exec(className)
  }
  result.container += className.substring(index).trimStart()
  return result
}
