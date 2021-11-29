import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'

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
  @put('/:gradeId', auth())
  async updateGrade(req, res) {
    let { gradeId } = req.params
    let { name, point } = req.body
    let grade
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
      await grade.save()
    } catch (error) {
      console.log(error)
    }
    res.status(httpStatusCodes.OK).send(grade)
  }
}
export default GradesCtrl
