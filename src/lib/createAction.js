export default type => {
  function actionCreator(payload) {
    return {
      type,
      ...payload
    }
  }
  actionCreator.toString = () => type
  return actionCreator
}
