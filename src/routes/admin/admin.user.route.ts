import express from 'express'
import userManageController from '@/controllers/admin/admin.user.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()
router.post('/', auth.auth, adminRole.adminRole, userManageController.getUsers)
router.patch('/suspend-users', auth.auth, adminRole.adminRole, userManageController.suspendUsers)
router.patch('/activate-users', auth.auth, adminRole.adminRole, userManageController.activateUsers)
router.post('/:id', auth.auth, adminRole.adminRole, userManageController.getUserById)
export default router
