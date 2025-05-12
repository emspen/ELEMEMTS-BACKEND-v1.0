import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync.utils'
import productService from '@/services/admin/admin.product.service'
import ApiError from '@/utils/apiError.utils'
import pick from '@/utils/pick.utils'
import {User} from '@prisma/client'

const /**
   * Create product
   *
   * @param {*} req
   * @param {*} res
   */
  createProduct = catchAsync(async (req, res) => {
    try {
      const productData = req.body
      const user = req.user as User
      productData.createdBy = user?.id

      const product = await productService.createProduct(productData)
      res.status(httpStatus.CREATED).send({
        status: 'success',
        data: {product},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating product',
      })
    }
  })

const /**
   * Get all products
   *
   * @param {*} req
   * @param {*} res
   */
  getAllProducts = catchAsync(async (req, res) => {
    try {
      const filters = pick(req.query, ['categoryId', 'attributes'])
      const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortType', 'search'])

      const products = await productService.getAllProducts(filters, options)
      res.status(httpStatus.OK).send({
        status: 'success',
        data: {
          products: products.data,
          pagination: {
            total: products.total,
            page: products.page,
            limit: products.limit,
          },
        },
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching products',
      })
    }
  })

const /**
   * Get product by ID
   *
   * @param {*} req
   * @param {*} res
   */
  getProductById = catchAsync(async (req, res) => {
    try {
      const productId = req.params.id
      if (!productId) throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required')

      const product = await productService.getProductById(productId)
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
      }

      res.status(httpStatus.OK).send({
        status: 'success',
        data: {product},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching the product',
      })
    }
  })

const /**
   * Update product by ID
   *
   * @param {*} req
   * @param {*} res
   */
  updateProductById = catchAsync(async (req, res) => {
    try {
      const productId = req.params.id
      if (!productId) throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required')

      const updateData = req.body
      const user = req.user as User
      updateData.updatedBy = user?.id

      const product = await productService.updateProductById(productId, updateData)
      res.status(httpStatus.OK).send({
        status: 'success',
        data: {product},
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while updating the product',
      })
    }
  })

const /**
   * Delete product by ID
   *
   * @param {*} req
   * @param {*} res
   */
  deleteProductById = catchAsync(async (req, res) => {
    try {
      const productId = req.params.id
      if (!productId) throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required')

      const user = req.user as User
      const deletedBy = user?.id

      await productService.deleteProductById(productId, deletedBy)
      res.status(httpStatus.OK).send({
        status: 'success',
        message: 'Product deleted successfully',
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while deleting the product',
      })
    }
  })

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
}
