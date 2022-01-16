import db from '../models/index'
import BaseCtrl from './base'
import { controller, get, post, put, del } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import { CLASSROOM_ROLE, CLASSROOM_STATUS } from '../utils/constants'
import debug from '../utils/debug'
import { sendEmail, generateInviteTemplate } from '../utils/mail'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { ensureTeacher } from 'src/middleware/classroom.middleware.js'
import classroomService from 'src/services/classroom.service'
import lodashGet from 'lodash/get'

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
    let classrooms
    try {
      classrooms = await db.Classroom.findAll({
        include: [
          {
            model: db.User,
            as: 'Owner',
            attributes: {
              exclude: ['password'],
            },
          },
          {
            model: db.ClassroomUser,
            where: { userId, status: CLASSROOM_STATUS.ACTIVE },
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
    } catch (error) {
      debug.log('classrooms-ctrl', error)
    }
    res.status(httpStatusCodes.OK).send(classrooms)
  }
  @get('/admin/classrooms', auth())
  async getClassroomByAdmin(req, res) {
    let classrooms
    try {
      classrooms = await db.Classroom.findAll({
        include: [
          {
            model: db.User,
            as: 'Owner',
            attributes: {
              exclude: ['password'],
            },
          },
        ],
      })
      res.json(classrooms)
    } catch (error) {
      debug.log('classroom-ctrl', error)
      res.status(httpStatusCodes.BAD_REQUEST).send(error)
    }
  }
  @del('/delete/:id', auth())
  async deleteClassroom(req, res) {
    let { id: classroomId } = req.params
    try {
      let delClassroom = await db.Classroom.destroy({
        where: {
          id: classroomId,
        },
      })
      res.json(delClassroom)
    } catch (error) {
      debug.log('error when del Class', error)
      res.status(httpStatusCodes.BAD_REQUEST).send(error)
    }
  }
  @get('/:id', auth())
  async getDetailClassroom(req, res) {
    let classroom
    let { id: classroomId } = req.params
    const userId = req.user.id
    try {
      classroom = await db.Classroom.findOne({
        where: { id: classroomId },
        include: [
          {
            model: db.ClassroomUser,
            attributes: ['role'],
            where: { userId },
          },
          {
            model: db.Grade,
          },
        ],
      })

      res.status(httpStatusCodes.OK).send({ userRole: classroom.ClassroomUsers[0].role, classroom })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send(error)
    }
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
        status: CLASSROOM_STATUS.ACTIVE,
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
        status: CLASSROOM_STATUS.ACTIVE,
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

    const users = await classroomService.getUsersByClassroomId(classroomId)

    res.status(httpStatusCodes.OK).send(users)
  }

  @post('/:id/invite', auth(), ensureTeacher())
  async inviteUsers(req, res) {
    const userId = req.user.id

    const { id: classroomId } = req.params
    const { email: userEmail, role } = req.body

    const classroom = await db.Classroom.findOne({
      where: { id: classroomId },
    })

    if (!classroom) {
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Classroom not exist' })
    }

    const invitingUser = await db.User.findOne({
      where: {
        email: userEmail,
      },
    })

    if (!invitingUser) {
      return res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'User not exist' })
    }

    const isUserExistInClass = await db.ClassroomUser.findOne({
      where: {
        userId: invitingUser.id,
        classroomId,
      },
    })

    if (isUserExistInClass) {
      return res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'User already in class' })
    }

    /**
     * TODO: Check exist invite but not accept
     */

    let classroomUser
    try {
      classroomUser = await db.ClassroomUser.create({
        userId: invitingUser.id,
        classroomId,
        role,
        status: CLASSROOM_STATUS.PENDING,
      })
      const token = jwt.sign({ classroomUser }, process.env.CLASSROOM_INVITE_SECRET, {
        expiresIn: '30m',
      })

      const url = `${process.env.FRONTEND_URL}/classrooms/join/accept-token?t=${token}`
      const emailTemplate = generateInviteTemplate(url, role, classroom)
      sendEmail(userEmail, emailTemplate)
    } catch (error) {
      debug.log('classrooms-ctrl', error)
    }

    const returnClassroomUser = { ...classroomUser.dataValues, User: invitingUser }

    res
      .status(httpStatusCodes.OK)
      .send({ message: 'Invite user successful', newUser: returnClassroomUser })
  }

  @put('/join/accept-token', auth())
  async acceptInviteToClass(req, res) {
    const userId = req.user.id
    const { token } = req.body

    let classroomUser
    try {
      classroomUser = jwt.verify(token, process.env.CLASSROOM_INVITE_SECRET).classroomUser
    } catch (error) {
      debug.log('classrooms-ctrl', error.message)
      if (error.message.includes('expired')) {
        return res.status(httpStatusCodes.BAD_REQUEST).send({ message: error.message })
      }
    }

    const isSameUser = Number(userId) === classroomUser.userId
    if (!isSameUser) {
      return res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Different user' })
    }

    try {
      await db.ClassroomUser.update(
        { status: CLASSROOM_STATUS.ACTIVE },
        { where: { id: classroomUser.id } }
      )
    } catch (error) {
      debug.log('classroom-ctrl', error)
    }

    res
      .status(httpStatusCodes.OK)
      .send({ message: 'Accept invite success', classroomId: classroomUser.classroomId })
  }

  @post('/:id/remove-user', auth(), ensureTeacher())
  async removeUser(req, res) {
    const userId = req.user.id
    const { id: classroomId } = req.params
    const { userId: removingUserId } = req.body

    if (userId === removingUserId) {
      return res
        .status(httpStatusCodes.BAD_REQUEST)
        .send({ message: 'You can not remove yourself' })
    }
    await db.ClassroomUser.destroy({
      where: {
        classroomId,
        userId: removingUserId,
      },
    })

    res.status(httpStatusCodes.OK).send({ message: 'Remove user successful' })
  }

  @post('/:id/upload', auth(), ensureTeacher())
  async handleUploadedUsers(req, res) {
    const { id: classroomId } = req.params
    const { data: uploadedUsers } = req.body

    try {
      await classroomService.updateUsersFromUploadFile(classroomId, uploadedUsers)
      return res.status(httpStatusCodes.OK).json({ message: 'Upload data success' })
    } catch (error) {
      debug.log('classroom-ctrl', error)
      return res.status(500)
    }
  }
}

export default ClassroomCtrl
