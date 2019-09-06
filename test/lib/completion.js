module.exports = f =>
  new Promise(resolve => {
    const interval = setInterval(() => {
      const result = f()
      if (result) {
        clearInterval(interval)
        resolve(result)
      }
    })
  })
