import db from '../models/index'
import BaseCtrl from './base'
import { controller, get, post } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import { CLASSROOM_ROLE } from '../utils/constants'
import debug from '../utils/debug'

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
  @get('/:id', auth())
  async getDetailClassroom(req, res) {
    let classroom
    let { id: classroomId } = req.params
    try {
      classroom = await db.Classroom.findOne({
        where: { id: classroomId },
      })
    } catch (error) {
      console.log(error)
    }
    res.status(httpStatusCodes.OK).send(classroom)
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
    const { name, section, subject } = req.body
    if (!name) {
      res.status(httpStatusCodes.BAD_REQUEST).send('Name is required')
    }
    let classroom
    try {
      classroom = await db.Classroom.create({
        name: name,
        section: section,
        subject: subject,
        ownerId: req.user.id,
      })
      await db.ClassroomUser.create({
        userId,
        classroomId: classroom.id,
        role: CLASSROOM_ROLE.TEACHER,
      })
    } catch (error) {
      debug.log('classroom-ctrl', error)
    }

    res.status(httpStatusCodes.OK).send(classroom)
  }

  @post('/join', auth())
  async joinClassroom(req, res) {
    const userId = req.user.id
    const { classroomId } = req.body

    let classroomUser

    // check input
    const existClassroom = await db.Classroom.findByPk(classroomId)

    if (!existClassroom) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Classroom not found' })
    }

    const existClassroomUser = await db.ClassroomUser.findOne({
      where: {
        classroomId,
        userId,
      },
    })

    if (existClassroomUser) {
      return res.status(httpStatusCodes.OK).send({ message: 'Already join classroom', classroomId })
    }

    try {
      classroomUser = await db.ClassroomUser.create({
        userId,
        classroomId,
        role: CLASSROOM_ROLE.STUDENT,
      })
    } catch (error) {
      debug.log('classroom-ctrl', error)
    }
    res.status(httpStatusCodes.OK).send(classroomUser)
  }

  @get('/:id/users', auth())
  async getClassroomUsers(req, res) {
    const userId = req.user.id

    const { id: classroomId } = req.params

    console.log(classroomId, userId)

    const isUserInClassroom = await db.ClassroomUser.count({
      where: {
        classroomId,
        userId,
      },
    })

    if (!isUserInClassroom) {
      return res
        .status(httpStatusCodes.BAD_REQUEST)
        .send({ message: 'User do not belong to classroom' })
    }

    const users = await db.ClassroomUser.findAll({
      where: { classroomId },
      raw: true,
      include: {
        model: db.User,
        exclude: ['password'],
      },
    })
    res.status(httpStatusCodes.OK).send(users)
  }
}

export default ClassroomCtrl
