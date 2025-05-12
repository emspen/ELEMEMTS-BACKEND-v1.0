import express from 'express'
import adminProductController from '@/controllers/admin/admin.product.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()

router.post('/', auth.auth, adminRole.adminRole, adminProductController.createProduct)

router.get('/', auth.auth, adminRole.adminRole, adminProductController.getAllProducts)

router.get('/:id', auth.auth, adminRole.adminRole, adminProductController.getProductById)

router.patch('/:id', auth.auth, adminRole.adminRole, adminProductController.updateProductById)

router.delete('/:id', auth.auth, adminRole.adminRole, adminProductController.deleteProductById)

export default router
