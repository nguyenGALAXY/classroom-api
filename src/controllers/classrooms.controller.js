import db from '../models/index'

export async function getClassrooms(req, res) {
  const classrooms = await db.Classroom.findAll({ include: db.User })
  res.send(200, classrooms)
}

export async function createClassroom(req, res) {
  const { name } = req.body
  const classroom = await db.Classroom.create({ name })
  console.log(classroom)
  res.send(201, classroom)
}

export default {
  getClassrooms,
  createClassroom
}
