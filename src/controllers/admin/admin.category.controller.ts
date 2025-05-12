import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync.utils'
import ApiError from '@/utils/apiError.utils'
import pick from '@/utils/pick.utils'
import categoryService from '@/services/admin/admin.category.service'

const /**
   * Create category
   *
   * @param {*} req
   * @param {*} res
   */
  createCategory = catchAsync(async (req, res) => {
    try {
      const categoryData = req.body
      const category = await categoryService.createCategory(categoryData)
      res.status(httpStatus.CREATED).send({
        status: 'success',
        data: {category},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating category',
      })
    }
  })

const /**
   * Get all categories
   *
   * @param {*} req
   * @param {*} res
   */
  getAllCategories = catchAsync(async (req, res) => {
    try {
      const includeChildren = req.query.includeChildren === 'true'
      const asTree = req.query.asTree === 'true'
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

      const categories = await categoryService.getAllCategories(
        includeChildren,
        asTree,
        page,
        limit
      )
      res.status(httpStatus.OK).send({
        status: 'success',
        data: {categories},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching categories',
      })
    }
  })

const /**
   * Get category by ID
   *
   * @param {*} req
   * @param {*} res
   */
  getCategoryById = catchAsync(async (req, res) => {
    try {
      const categoryId = req.params.id
      if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required')

      const asTree = req.query.asTree === 'true'
      const category = await categoryService.getCategoryById(categoryId, asTree)

      if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Category not found')
      }

      res.status(httpStatus.OK).send({
        status: 'success',
        data: {category},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching the category',
      })
    }
  })

const /**
   * Update category by ID
   *
   * @param {*} req
   * @param {*} res
   */
  updateCategoryById = catchAsync(async (req, res) => {
    try {
      const categoryId = req.params.id
      if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required')

      const updateData = req.body
      const category = await categoryService.updateCategoryById(categoryId, updateData)

      res.status(httpStatus.OK).send({
        status: 'success',
        data: {category},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while updating the category',
      })
    }
  })

const /**
   * Delete category by ID
   *
   * @param {*} req
   * @param {*} res
   */
  deleteCategoryById = catchAsync(async (req, res) => {
    try {
      const categoryId = req.params.id
      if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required')

      await categoryService.deleteCategoryById(categoryId)

      res.status(httpStatus.OK).send({
        status: 'success',
        message: 'Category deleted successfully',
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while deleting the category',
      })
    }
  })

export default {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
}
