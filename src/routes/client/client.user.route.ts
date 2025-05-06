import express from 'express'
import userManageController from '@/controllers/admin/admin.user.controller'

const router = express.Router()
router.post('/users', userManageController.getUsers)

export default router
