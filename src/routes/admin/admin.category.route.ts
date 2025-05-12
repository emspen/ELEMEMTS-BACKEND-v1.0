import express from 'express'
import adminCategoryController from '@/controllers/admin/admin.category.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()

router.post('/', auth.auth, adminRole.adminRole, adminCategoryController.createCategory)

router.get('/', auth.auth, adminRole.adminRole, adminCategoryController.getAllCategories)

router.get('/:id', auth.auth, adminRole.adminRole, adminCategoryController.getCategoryById)

router.patch('/:id', auth.auth, adminRole.adminRole, adminCategoryController.updateCategoryById)

router.delete('/:id', auth.auth, adminRole.adminRole, adminCategoryController.deleteCategoryById)

export default router
