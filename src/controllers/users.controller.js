import db from '../models/index'

export async function getUsers(req, res) {
  const users = await db.User.findAll({ include: db.Classroom })
  res.send(200, users)
}

export default {
  getUsers
}
