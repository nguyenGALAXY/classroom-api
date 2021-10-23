import db from '../models/index'
import BaseCtrl from './base'
import { controller, get } from 'route-decorators'
// export async function getClassrooms(req, res) {
//   const classrooms = await db.Classroom.findAll({ include: db.User })
//   res.send(200, classrooms)
// }

// export async function createClassroom(req, res) {
//   const { name } = req.body
//   const classroom = await db.Classroom.create({ name })
//   res.send(201, classroom)
// }

// export default {
//   getClassrooms,
//   createClassroom
// }

@controller('/api/classrooms')
class ClassroomCtrl extends BaseCtrl {
  @get('/')
  async getClassrooms(req, res) {
    const classrooms = await db.Classroom.findAll({ include: db.User })
    res.send(200, classrooms)
  }
}

export default ClassroomCtrl
