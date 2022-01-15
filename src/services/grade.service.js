import isEmpty from 'lodash/isEmpty'
import lodashGet from 'lodash/get'
import _ from 'lodash'
import db from 'src/models'
import { CLASSROOM_ROLE } from 'src/utils/constants'
import debug from 'src/utils/debug'
import classroomService from 'src/services/classroom.service'

export async function getGrades(classroomId) {
  let grades

  try {
    grades = await db.Grade.findAll({
      where: { classroomId },
      include: [
        {
          model: db.GradeUser,
          include: [{ model: db.User, exclude: ['password'] }],
        },
      ],
      raw: true,
    })
  } catch (error) {
    debug.log('grade-service', error)
  }

  const users = {}
  const gradeProperties = ['id', 'classroomId', 'name', 'point', 'index', 'finalized']
  let returnGrades = _.unionBy(grades, 'id').map((g) => _.pick(g, gradeProperties))

  grades.forEach((grade) => {
    const userProperties = [
      'GradeUsers.User.id',
      'GradeUsers.User.username',
      'GradeUsers.User.firstName',
      'GradeUsers.User.lastName',
      'GradeUsers.User.email',
      'GradeUsers.User.phone',
      'GradeUsers.User.status',
      'GradeUsers.User.studentId',
      'GradeUsers.User.picture',
      'GradeUsers.assignment',
      'GradeUsers.point',
      'GradeUsers.reviewGradeId',
    ]

    let keymap = {
      'GradeUsers.User.id': 'User.id',
      'GradeUsers.User.username': 'User.username',
      'GradeUsers.User.firstName': 'User.firstName',
      'GradeUsers.User.lastName': 'User.lastName',
      'GradeUsers.User.email': 'User.email',
      'GradeUsers.User.phone': 'User.phone',
      'GradeUsers.User.status': 'User.status',
      'GradeUsers.User.studentId': 'User.studentId',
      'GradeUsers.User.picture': 'User.picture',
      'GradeUsers.assignment': 'assignment',
      'GradeUsers.point': 'point',
      'GradeUsers.reviewGradeId': 'reviewGradeId',
    }

    if (isEmpty(users[grade.id])) {
      if (lodashGet(grade, 'GradeUsers.User.id'))
        users[grade.id] = [
          _.mapKeys(_.pick(grade, userProperties), function (v, k) {
            return keymap[k]
          }),
        ]
    } else {
      if (lodashGet(grade, 'GradeUsers.User.id'))
        users[grade.id].push(
          _.mapKeys(_.pick(grade, userProperties), function (v, k) {
            return keymap[k]
          })
        )
    }
  })

  // Map list of student to gradeUser
  const students = await classroomService.getUsersByClassroomId(classroomId, {
    roles: [CLASSROOM_ROLE.STUDENT],
  })
  returnGrades.forEach((g) => {
    const gradeId = g.id
    users[gradeId] = !users[gradeId] ? students : _.unionBy(users[gradeId], students, 'User.id')
  })

  returnGrades.forEach((g) => {
    g.users = lodashGet(users, g.id, [])
  })

  return returnGrades
}

export async function updateUserGrade(gradeId, userId, point) {
  let result

  // upsert will return an array with two value [record: obj, created: bool]
  try {
    result = await db.GradeUser.upsert(
      { gradeId, userId, point },
      {
        where: { gradeId, userId },
        raw: true,
        returning: true,
      }
    )
  } catch (err) {
    debug.log('grade-ctrl', err)
  }
  return result[0]
}

export default {
  getGrades,
  updateUserGrade,
}
