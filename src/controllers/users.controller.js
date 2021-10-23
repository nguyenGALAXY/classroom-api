import db from '../models/index'

export async function getUsers(req, res, next) {
  const users = await db.User.findAll({ include: db.Classroom })
  res.send(users)
}

export default {
  getUsers
}
