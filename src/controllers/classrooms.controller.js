import db from '../models/index'
import BaseCtrl from './base'
import { controller, get, post } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'

/**
 * @swagger
 * components:
 *   schemas:
 *     Classroom:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         ownerId:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   - name: Classroom
 */

@controller('/api/classrooms')
class ClassroomCtrl extends BaseCtrl {
  /**
   * @swagger
   * /api/classrooms:
   *   get:
   *     summary: Get all classrooms
   *     tags:
   *       - Classroom
   *     responses:
   *       "200":
   *         description: Get all classrooms successful
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Classroom"
   */
  @get('/', auth())
  async getClassrooms(req, res) {
    const userId = req.user.id
    const classrooms = await db.Classroom.findAll({
      include: [
        {
          model: db.User,
          as: 'Owner',
          attributes: {
            exclude: ['password'],
          },
          where: { id: userId },
        },
        {
          model: db.ClassroomUser,
          where: { userId },
          include: [
            {
              model: db.User,
              attributes: {
                exclude: ['password'],
              },
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    })
    res.status(httpStatusCodes.OK).send(classrooms)
  }

  /**
   * @swagger
   * /api/classrooms:
   *   post:
   *     summary: Create classroom
   *     tags:
   *       - Classroom
   *     requestBody:
   *       required:
   *           - name
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       "200":
   *         description: Get all classrooms successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Classroom"
   *
   */
  @post('/', auth())
  async createClassroom(req, res) {
    const userId = req.user.id
    const { name } = req.body
    if (!name) {
      res.status(httpStatusCodes.BAD_REQUEST).send('Name is required')
    }
    const classroom = await db.Classroom.create({ name, ownerId: req.user.id })
    await db.ClassroomUser.create({ userId, classroomId: classroom.id })
    res.status(httpStatusCodes.OK).send(classroom)
  }
}

export default ClassroomCtrl
