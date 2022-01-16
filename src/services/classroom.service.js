import db from 'src/models'
import { Op } from 'sequelize'
import isEmpty from 'lodash/isEmpty'
import { CLASSROOM_STATUS } from 'src/utils/constants'
import lodashGet from 'lodash/get'

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

export async function updateUsersFromUploadFile(classroomId, uploadedUsers) {
  const studentIds = uploadedUsers.map((user) => user.studentId.toString())
  try {
    const classroomUsers = await db.ClassroomUser.findAll({
      include: [
        {
          model: db.User,
          where: { studentId: { [Op.in]: studentIds } },
        },
      ],
      where: {
        classroomId,
      },
      raw: true,
    })

    /**
     * {id: , fullName:}
     */
    const updatingClassroomUsers = classroomUsers.map((clrUser) => {
      const id = clrUser.id
      const uploadedUser = uploadedUsers.find(
        (u) => u.studentId == lodashGet(clrUser, 'User.studentId')
      )

      return {
        id: id,
        fullName: uploadedUser.fullName,
      }
    })
    const result = await Promise.all(
      updatingClassroomUsers.map(async (clrUser) => {
        const [updatedRow, value] = await db.ClassroomUser.update(
          {
            fullName: clrUser.fullName,
          },
          {
            where: {
              id: clrUser.id,
            },
            returning: true,
            raw: true,
          }
        )
        return value[0]
      })
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export async function getClassroomById(id) {
  return db.Classroom.findByPk(id, { raw: true })
}
export default {
  getUsersByClassroomId,
  updateUsersFromUploadFile,
  getClassroomById,
}
