const buildCategoryWithParents = (categoryId: string, categories: any[]): any => {
  const map = new Map(categories.map((cat) => [cat.id, cat]))

  const build = (cat: any): any => {
    if (!cat) return null
    const parent = cat.parentId ? build(map.get(cat.parentId)) : null
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId,
      parent: parent
        ? {
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            parentId: parent.parentId,
            parent: parent.parent,
          }
        : null,
    }
  }

  return build(map.get(categoryId))
}
export default buildCategoryWithParents
