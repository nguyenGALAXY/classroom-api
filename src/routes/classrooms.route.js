import express from 'express'
import classroomsController from '../controllers/classrooms.controller'

const router = express.Router()

router.get('/', classroomsController.getClassrooms)
router.post('/', classroomsController.createClassroom)

export default router
