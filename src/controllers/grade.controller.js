import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, del, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import debug from 'src/utils/debug'

@controller('/api/classrooms/:id/grades')
class GradesCtrl extends BaseCtrl {
  @post('/', auth())
  async createGrade(req, res) {
    let { point, name } = req.body
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
        classroomId,
      })
    } catch (error) {
      console.log(error)
    }
    res.status(httpStatusCodes.OK).send(grade)
  }

  @get('/', auth())
  async getGrades(req, res) {
    const { id: classroomId } = req.params

    let grades

    try {
      grades = await db.Grade.findAll({
        where: {
          classroomId,
        },
      })
    } catch (error) {
      debug.log('grade-ctrl', error)
    }
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
        {
          where: { id: gradeId },
        }
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
}

export default GradesCtrl
