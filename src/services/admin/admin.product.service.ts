import httpStatus from 'http-status'
import prisma from '@/prisma/client'
import ApiError from '@/utils/apiError.utils'
import {Prisma, Product} from '@prisma/client'
import generateSlug from '@/utils/generateSlug.utils'

type ProductInput = Omit<Prisma.ProductCreateInput, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
type UpdateProductInput = Partial<ProductInput> & {tags?: string[]}

const createProduct = async (
  input: ProductInput & {tags?: string[]; createdBy?: string}
): Promise<Product> => {
  try {
    // Validate required fields
    if (!input.name || !input.description) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Name and description are required')
    }
    const slug = generateSlug(input.name)
    if (await prisma.product.findUnique({where: {slug}}))
      throw new ApiError(httpStatus.BAD_REQUEST, 'Product name is duplicated!')
    if (input.category?.connect?.id) {
      // Validate category exists
      await prisma.category.findUniqueOrThrow({
        where: {id: input.category.connect.id},
      })
    }

    return prisma.product.create({
      data: {
        ...input,
        slug: slug,
        tags: input.tags
          ? {
              connectOrCreate: input.tags.map((tag) => ({
                where: {name: tag},
                create: {name: tag},
              })),
            }
          : undefined,
        createdBy: input.createdBy,
      },
      include: {
        category: true,
        tags: true,
      },
    })
  } catch (error: any) {
    if (error instanceof ApiError) throw error
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create product')
  }
}

const getAllProducts = async (
  filters: {
    categoryId?: string
    attributes?: Record<string, any>
  },
  options: {
    limit?: number
    page?: number
    sortBy?: keyof Prisma.ProductOrderByWithRelationInput
    sortType?: 'asc' | 'desc'
    search?: string
  }
): Promise<{data: Product[]; total: number; page: number; limit: number}> => {
  const {limit = 20, page = 1, sortBy = 'createdAt', sortType = 'desc', search} = options

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    deleted: false,
    ...(filters.categoryId && {categoryId: filters.categoryId}),
    ...(filters.attributes && {
      // For JSONB, use Prisma's JSON filtering
      attributes: {
        // All key-value pairs in filters.attributes must match
        path: Object.keys(filters.attributes),
        equals: Object.values(filters.attributes),
      },
    }),
    ...(search && {
      OR: [
        {name: {contains: search, mode: 'insensitive'}},
        {description: {contains: search, mode: 'insensitive'}},
        {category: {name: {contains: search, mode: 'insensitive'}}},
        {attributes: {path: ['$.*'], string_contains: search}},
      ],
    }),
  }

  // Query products with pagination, sorting, and relations
  const [total, data] = await Promise.all([
    prisma.product.count({where}),
    prisma.product.findMany({
      where,
      orderBy: {[sortBy]: sortType},
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        tags: true,
      },
    }),
  ])

  return {
    data,
    total,
    page,
    limit,
  }
}

const getProductById = async (id: string): Promise<Product | null> => {
  if (!id || typeof id !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid product ID is required')
  }
  try {
    return prisma.product.findUnique({
      where: {id, deleted: false},
      include: {
        category: true,
        tags: true,
      },
    })
  } catch (error: any) {
    if (error instanceof ApiError) throw error
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to get product', error.message)
  }
}

const updateProductById = async (
  id: string,
  updateData: UpdateProductInput & {updatedBy?: string}
): Promise<Product> => {
  return prisma.$transaction(async (tx) => {
    try {
      const existing = await tx.product.findUniqueOrThrow({
        where: {id, deleted: false},
      })

      // Detect schema-breaking changes
      const versionIncrement = ['attributes', 'previewType'].some(
        (field) =>
          field in updateData &&
          updateData[field as keyof UpdateProductInput] !== existing[field as keyof Product]
      )
        ? 1
        : 0

      return tx.product.update({
        where: {id},
        data: {
          ...updateData,
          productVersion: existing.productVersion + versionIncrement,
          tags: updateData.tags ? {set: updateData.tags.map((id) => ({id}))} : undefined,
          updatedBy: updateData.updatedBy,
        },
        include: {
          category: true,
          tags: true,
        },
      })
    } catch (error: any) {
      if (error instanceof ApiError) throw error
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to update product', error.message)
    }
  })
}

// --- Soft Delete Implementation ---
const deleteProductById = async (id: string, deletedBy: string): Promise<Product> => {
  return prisma.$transaction(async (tx) => {
    try {
      const existing = await tx.product.findUniqueOrThrow({
        where: {id, deleted: false},
      })

      return tx.product.update({
        where: {id},
        data: {
          deleted: true,
          updatedBy: deletedBy,
        },
      })
    } catch (error: any) {
      if (error instanceof ApiError) throw error
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete product', error.message)
    }
  })
}

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
}
