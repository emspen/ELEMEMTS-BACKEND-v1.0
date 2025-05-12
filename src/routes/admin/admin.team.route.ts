import express from 'express'
import adminTeamController from '@/controllers/admin/admin.team.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()
router.post('/', auth.auth, adminRole.adminRole, adminTeamController.getTeams)
export default router
