import httpStatus from 'http-status'
import prisma from '@/prisma/client'
import ApiError from '@/utils/apiError.utils'
import {Category, Prisma} from '@prisma/client'
import generateSlug from '@/utils/generateSlug.utils'
import buildCategoryWithParents from '@/utils/buildCategoryTree.utils'

type CategoryInput = Omit<Prisma.CategoryCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & {
  parentId?: string
}

interface CategoryWithRelations extends Category {
  parent?: Category
  children: CategoryWithTree[]
}

interface CategoryWithTree extends Category {
  children: CategoryWithTree[]
}

const createCategory = async (data: CategoryInput): Promise<any> => {
  return await prisma.$transaction(async (tx) => {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Category name is required')
      }

      const existingCategory = await prisma.category.findFirst({
        where: {
          name: data.name,
          deleted: false,
        },
      })

      if (existingCategory) {
        throw new ApiError(httpStatus.CONFLICT, 'Category with this name already exists')
      }

      if (data.parentId) {
        await prisma.category.findUniqueOrThrow({
          where: {id: data.parentId, deleted: false},
        })
      }

      const slug = generateSlug(data.name)
      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug: slug,
          parent: data.parentId ? {connect: {id: data.parentId}} : undefined,
        },
      })
      return category
    } catch (error: any) {
      if (error instanceof ApiError) throw error
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create category', error.message)
    }
  })
}

const getAllCategories = async (includeChildren = true, asTree = false, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit
    const categories = await prisma.category.findMany({
      where: {deleted: false},
      include: {
        parent: includeChildren,
        children: includeChildren,
      },
      orderBy: {name: 'asc'},
      skip,
      take: limit,
    })

    if (!asTree) {
      return categories
    }

    // Transform flat list into tree structure
    const categoryMap = new Map()
    const rootCategories: (typeof categoryMap)[] = []

    // First pass: create a map of categories by id
    categories.forEach((category) => {
      categoryMap.set(category.id, {...category, children: []})
    })

    // Second pass: build the tree structure
    categories.forEach((category) => {
      const mappedCategory = categoryMap.get(category.id)

      if (category.parentId) {
        // This is a child category, add it to its parent's children array
        const parentCategory = categoryMap.get(category.parentId)
        if (parentCategory) {
          parentCategory.children.push(mappedCategory)
        }
      } else {
        // This is a root category
        rootCategories.push(mappedCategory)
      }
    })

    return rootCategories
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to fetch categories')
  }
}

const getCategoryById = async (id: string, asTree = false) => {
  try {
    // First, get the requested category with its immediate children
    const category = await prisma.category.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    if (!category) {
      return null
    }

    if (!asTree) {
      return category
    }

    // If asTree is true, we need to get all descendants recursively
    const allCategories = await prisma.category.findMany({
      where: {deleted: false},
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        parent: true,
      },
    })
    return buildCategoryWithParents(id, allCategories)
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to fetch category')
  }
}

const updateCategoryById = async (id: string, updateData: {name?: string; parentId?: string}) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUniqueOrThrow({
        where: {id, deleted: false},
      })

      // Prevent circular parent relationships
      if (updateData.parentId === id) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Category cannot be its own parent')
      }

      // Check if parentId exists if it's being updated
      if (updateData.parentId) {
        const parentExists = await tx.category.findUnique({
          where: {id: updateData.parentId, deleted: false},
        })

        if (!parentExists) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Parent category does not exist')
        }

        // Check for deeper circular references
        let currentParentId: string | null = updateData.parentId
        const visitedIds = new Set([id])

        while (currentParentId) {
          if (visitedIds.has(currentParentId)) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              'Circular reference detected in category hierarchy'
            )
          }

          visitedIds.add(currentParentId)

          const parent: {parentId: string | null} | null = await tx.category.findUnique({
            where: {id: currentParentId, deleted: false},
            select: {parentId: true},
          })

          if (!parent) break
          currentParentId = parent.parentId
        }
      }

      return tx.category.update({
        where: {id},
        data: {
          ...updateData,
          slug: updateData.name ? generateSlug(updateData.name) : undefined,
        },
      })
    })
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to update category')
  }
}

const deleteCategoryById = async (id: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUniqueOrThrow({
        where: {id, deleted: false},
      })
    })
  } catch (error) {
    if (error) throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete category')
  }
}

export default {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
}
