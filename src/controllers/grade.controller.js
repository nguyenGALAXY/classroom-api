import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
const { Op } = require('sequelize')

@controller('/api/grades')
class GradesCtrl extends BaseCtrl {
  @post('/')
  async createGrade(req, res) {
    let { point, name } = req.body
    let grade
    if (!name && !point) {
      res.status(httpStatusCodes.BAD_REQUEST).send('Name and point is required')
    }
    try {
      grade = db.Grade.create({
        name: name,
        point: point,
        classroomId: req.classroom.id,
      })
      console.log('log in:', name, point, classroomId)
    } catch (error) {
      console.log(error)
    }
  }
  @get('/')
  async getGrades(req, res) {
    let grades
    try {
      grades = await db.Grade.findAll()
      console.log(grades)
    } catch (error) {
      console.log(error)
    }
  }
}
export default GradesCtrl
