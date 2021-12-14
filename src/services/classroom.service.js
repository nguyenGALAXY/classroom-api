import db from 'src/models'
import { Op } from 'sequelize'
import isEmpty from 'lodash/isEmpty'
import { CLASSROOM_STATUS } from 'src/utils/constants'

export async function getUsersByClassroomId(classroomId, opt = { roles: [] }) {
  const { roles } = opt

  const where = {
    classroomId,
    status: { [Op.in]: [CLASSROOM_STATUS.PENDING, CLASSROOM_STATUS.ACTIVE] },
  }

  if (!isEmpty(roles)) {
    where.role = { [Op.in]: roles }
  }

  const users = await db.ClassroomUser.findAll({
    where: where,
    raw: true,
    include: {
      model: db.User,
      attributes: {
        exclude: ['password'],
      },
    },
  })

  return users
}

export default {
  getUsersByClassroomId,
}
