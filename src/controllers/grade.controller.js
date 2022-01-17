import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, del, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import debug from 'src/utils/debug'
import _ from 'lodash'
import gradeService from 'src/services/grade.service'
import reviewGradeService from 'src/services/reviewGrade.service'
import classroomService from 'src/services/classroom.service'
import { CLASSROOM_ROLE, NOTIFICATION_STATUS } from 'src/utils/constants'
import socket from 'src/socket'

@controller('/api/classrooms/:id/grades')
class GradesCtrl extends BaseCtrl {
  @post('/', auth())
  async createGrade(req, res) {
    let { point, name, index } = req.body
    let { id: classroomId } = req.params
    // TODO: Check user is belong to classroom

    if (!name && !point) {
      res.status(httpStatusCodes.BAD_REQUEST).send('Name and point is required')
    }

    let grade
    try {
      grade = await db.Grade.create({
        name: name,
        point: point,
        index: index,
        classroomId,
      })
    } catch (error) {
      debug.log('grade-ctrl', error)
    }
    res.status(httpStatusCodes.OK).send(grade)
  }

  @put('/arrange', auth())
  async arrangeGrade(req, res) {
    try {
      const item = req.body
      const { id: classroomId } = req.params
      let count = 0 //count position item in array
      item.map(async (grade) => {
        await db.Grade.update(
          {
            index: count,
          },
          {
            where: { id: grade.id },
          }
        )
        count++
      })
      const Grades = await db.Grade.findAll({
        where: { classroomId },
      })
      res.status(httpStatusCodes.OK).json(Grades)
    } catch (error) {
      return res.status(500).json({ msg: error.message })
    }
  }

  @get('/', auth())
  async getGrades(req, res) {
    const { id: classroomId } = req.params

    let grades = await gradeService.getGrades(classroomId)

    res.status(httpStatusCodes.OK).send(grades)
  }

  @put('/:gradeId', auth())
  async updateGrade(req, res) {
    let { gradeId } = req.params
    let { name, point } = req.body
    if (!name && !point) {
      res.status(httpStatusCodes.BAD_REQUEST).send('Name and point is required')
    }
    try {
      await db.Grade.update(
        {
          name: name,
          point: point,
        },
        { where: { id: gradeId } }
      )
    } catch (error) {
      debug.log('grade-ctrl', error)
    }
    res.status(httpStatusCodes.OK).send({ message: 'Update assignment successful' })
  }

  @del('/:gradeId', auth())
  async deleteGrade(req, res) {
    const { gradeId } = req.params
    await db.Grade.destroy({
      where: {
        id: gradeId,
      },
    })
    res.status(httpStatusCodes.OK).send({ message: 'Delete assignment successful' })
  }

  @post('/:gradeId/users/:userId', auth())
  async updateUserGrade(req, res) {
    const { gradeId, userId } = req.params
    // Right now, we only update point
    const { point } = req.body
    const gradeUser = await gradeService.updateUserGrade(gradeId, userId, point)

    res.status(httpStatusCodes.OK).send({ message: 'Update user grade success', data: gradeUser })
  }

  @post('/:gradeId', auth())
  async updateColumnGrade(req, res) {
    const { gradeId } = req.params
    const { colGrades } = req.body
    let updatedCol = await Promise.all(
      colGrades.map(async (g) => {
        const gradeUser = await gradeService.updateUserGrade(gradeId, g.userId, g.point)
        return gradeUser.dataValues
      })
    )
    res
      .status(httpStatusCodes.OK)
      .send({ message: 'Update column grade success', data: updatedCol })
  }
  @post('/:gradeId/finalized', auth())
  async finalizedGrade(req, res) {
    const { gradeId } = req.params
    try {
      let [_, grade] = await db.Grade.update(
        { finalized: true },
        { where: { id: gradeId }, returning: true }
      )

      // extract value from returning array
      grade = grade[0]

      // create notification to all student in class
      const classroomId = grade.classroomId
      const classroom = await classroomService.getClassroomById(classroomId)
      const students = await classroomService.getUsersByClassroomId(classroomId, {
        roles: [CLASSROOM_ROLE.STUDENT],
      })

      const notifications = students.map((s) => ({
        userId: s.userId,
        content: `Grade ${grade.name} in classroom ${classroom.name} has been finalized.`,
        status: NOTIFICATION_STATUS.UNREAD,
      }))

      await db.Notification.bulkCreate(notifications)

      const studentIds = students.map((s) => s.userId)
      socket.notifyMultipleClients(studentIds)

      res.status(httpStatusCodes.OK).send({ message: 'Finalized success' })
    } catch (error) {
      debug.log('grade-ctrl', error.message)
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Finalized fail' })
    }
  }
  @post('/reviewGrade/:gradeId', auth())
  async createReviewGrade(req, res) {
    const userId = req.user.id
    const { gradeId } = req.params
    const { explanation, expectationGrade } = req.body
    if (explanation == null || expectationGrade == null) {
      res
        .status(httpStatusCodes.BAD_REQUEST)
        .send({ message: 'Request review fail, please enter fill attibutes' })
    } else {
      try {
        const responses = await db.ReviewGrade.create({
          explanation: explanation,
          expectationGrade: expectationGrade,
          gradeId: gradeId,
          ownerId: userId,
        })
        const reviewGradeId = responses.dataValues.id
        await db.GradeUser.update(
          {
            reviewGradeId,
          },
          {
            where: { gradeId, userId },
          }
        )

        // notify to all teacher of the classes
        const grade = await db.Grade.findByPk(gradeId, { raw: true })
        const classroom = await db.Classroom.findByPk(grade.classroomId)
        const teachers = await classroomService.getUsersByClassroomId(classroom.id, {
          roles: [CLASSROOM_ROLE.TEACHER],
        })

        const notifications = teachers.map((t) => ({
          userId: t.userId,
          content: `New grade review in classroom ${classroom.name} for grade ${grade.name}`,
          status: NOTIFICATION_STATUS.UNREAD,
        }))
        await db.Notification.bulkCreate(notifications)

        const teacherIds = await teachers.map((t) => t.userId)
        socket.notifyMultipleClients(teacherIds)

        res.status(httpStatusCodes.OK).send({ reviewGradeId, message: 'Request review success' })
      } catch (error) {
        res.status(httpStatusCodes.BAD_REQUEST).send({ message: error.message })
      }
    }
  }
  @get('/reviewGrade/:reviewGradeId', auth())
  async getReviewGrade(req, res) {
    const { reviewGradeId } = req.params
    try {
      const reviewGrade = await reviewGradeService.getReviewGradebyId(reviewGradeId)
      const commentsReview = await reviewGradeService.getCommentReviewGrade(reviewGradeId)
      res.status(httpStatusCodes.OK).send({ reviewGrade, commentsReview })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Get review grade fail' })
    }
  }
  @get('/reviewGrade', auth())
  async getReviewGrades(req, res) {
    const { id } = req.params
    try {
      const reviewGrade = await reviewGradeService.getReviewGrades(id)
      res.status(httpStatusCodes.OK).send({ reviewGrade })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Get review grade fail' })
    }
  }
  @post('/reviewGrade/:reviewGradeId/comment', auth())
  async commentReviewGrade(req, res) {
    const userId = req.user.id
    const { reviewGradeId } = req.params
    const { content } = req.body
    if (content == null) {
      res
        .status(httpStatusCodes.BAD_REQUEST)
        .send({ message: 'Comment fail, please fill content comment' })
    } else {
      try {
        const response = await db.CommentReviewGrade.create({
          content,
          reviewGradeId,
          userId,
        })
        res
          .status(httpStatusCodes.OK)
          .send({ comment: response, message: 'Comment review success' })

        // createNotify
        const reviewGrade = await db.ReviewGrade.findByPk(reviewGradeId, { raw: true })
        const ownerId = reviewGrade.ownerId
        const grade = await db.Grade.findByPk(reviewGrade.gradeId, { raw: true })

        // comment by teacher
        if (userId !== ownerId) {
          await db.Notification.create({
            userId: ownerId,
            content: `Teacher have reply your review on grade ${grade.name}`,
            status: NOTIFICATION_STATUS.UNREAD,
          })
          socket.notifyClient(ownerId)
        }
      } catch (error) {
        res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Comment review fail' })
      }
    }
  }
  @post('/reviewGrade/:reviewGradeId/finalDecision', auth())
  async finalDecisionGrade(req, res) {
    const { reviewGradeId } = req.params
    const { gradeId, userId, point } = req.body
    try {
      const gradeUser = reviewGradeService.finalDecisionReview(
        gradeId,
        userId,
        point,
        reviewGradeId
      )

      const updatedGrade = await db.Grade.findByPk(gradeId, { raw: true })

      // notify to student
      await db.Notification.create({
        userId,
        content: `Teacher have finalize your review on grade ${updatedGrade.name}`,
        status: NOTIFICATION_STATUS.UNREAD,
      })
      socket.notifyClient(userId)

      res.status(httpStatusCodes.OK).send({ gradeUser })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Get review grade fail' })
    }
  }
}
export default GradesCtrl
