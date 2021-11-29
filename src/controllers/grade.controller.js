import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
const { Op } = require('sequelize')
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
      console.log(error)
    }
    res.status(httpStatusCodes.OK).send(grade)
  }
  @put('/arrange/:idGrade1/:idGrade2', auth())
  async arrangeGrade(req, res) {
    try {
      const { idGrade1: id1, idGrade2: id2 } = req.params
      const { id: classroomId } = req.params
      //Find index 2 grade to swap
      const indexs = await db.Grade.findAll({
        attributes: { exclude: ['password'] },
        where: { [Op.or]: [{ id: id1 }, { id: id2 }], classroomId: classroomId },
      })
      //Swap 2 grade index
      await db.Grade.update(
        {
          index: indexs[1].index,
        },
        {
          where: { id: id1 },
        }
      )
      await db.Grade.update(
        {
          index: indexs[0].index,
        },
        {
          where: { id: id2 },
        }
      )
      const Grades = await db.Grade.findAll({
        where: { classroomId },
      })
      res.status(httpStatusCodes.OK).json(Grades)
    } catch (error) {
      return res.status(500).json({ msg: error.message })
    }
  }
}
export default GradesCtrl
