export const getHierarchy = (id, data, roots = ['root']) => {
  if (!id || !data) {
    return
  }
  const attachParent = (nodeId, node, hierarchy) => {
    hierarchy.unshift(nodeId)
    for (const child of node.children || []) {
      if (child === id) {
        return hierarchy
      }
      const children = attachParent(child, data[child], [
        ...hierarchy
      ])
      if (children) {
        return children
      }
    }
  }
  for (const root of roots) {
    const hierarchy = attachParent(root, data[root], [])
    if (hierarchy) {
      return hierarchy
    }
  }
}
