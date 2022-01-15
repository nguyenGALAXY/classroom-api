import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, del, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import debug from 'src/utils/debug'
import { Op } from 'sequelize'
import _ from 'lodash'
import gradeService from 'src/services/grade.service'
import reviewGradeService from 'src/services/reviewGrade.service'

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
    // TODO: Enhance to update assignment when
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
      await db.Grade.update({ finalized: true }, { where: { id: gradeId } })
      res.status(httpStatusCodes.OK).send({ message: 'Finalized success' })
    } catch (error) {
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
      res.status(httpStatusCodes.OK).send({ gradeUser })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send({ message: 'Get review grade fail' })
    }
  }
}
export default GradesCtrl
