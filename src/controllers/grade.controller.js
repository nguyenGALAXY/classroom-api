import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, del, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import debug from 'src/utils/debug'
import { Op } from 'sequelize'
import _ from 'lodash'
import gradeService from 'src/services/grade.service'

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
}
export default GradesCtrl
