import express from 'express'
import userManageController from '@/controllers/admin/admin.user.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()
router.post('/users', auth.auth, adminRole.adminRole, userManageController.getUsers)
router.post('/suspend-users', auth.auth, adminRole.adminRole, userManageController.suspendUsers)

export default router
