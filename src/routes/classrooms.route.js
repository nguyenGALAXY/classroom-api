import express from 'express'
import classroomsController from '../controllers/classrooms.controller'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Classroom:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 */

router.get('/', classroomsController.getClassrooms)
router.post('/', classroomsController.createClassroom)

export default router
