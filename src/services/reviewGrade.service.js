import isEmpty from 'lodash/isEmpty'
import lodashGet from 'lodash/get'
import _ from 'lodash'
import db from 'src/models'
import { CLASSROOM_ROLE } from 'src/utils/constants'
import debug from 'src/utils/debug'
import classroomService from 'src/services/classroom.service'
import { updateUserGrade } from './grade.service'

export async function getReviewGradebyId(reviewGradeId) {
  let reviewGrade
  try {
    reviewGrade = await db.ReviewGrade.findOne({
      where: { id: reviewGradeId },
      include: [
        {
          model: db.GradeUser,
          include: [{ model: db.User, attributes: ['username', 'studentId'] }],
        },
        { model: db.Grade },
      ],
      raw: true,
    })
  } catch (error) {
    debug.log('grade-service', error)
  }
  return reviewGrade
}
export async function getReviewGrades(classroomId) {
  let reviewGrade
  try {
    reviewGrade = await db.ReviewGrade.findAll({
      include: [
        {
          model: db.Grade,
          where: {
            classroomId,
          },
        },
        {
          model: db.User,
          attributes: ['username', 'studentId'],
        },
      ],
      raw: true,
    })
  } catch (error) {
    debug.log('grade-service', error)
  }
  return reviewGrade
}
export async function getCommentReviewGrade(reviewGradeId) {
  let comment
  try {
    comment = await db.CommentReviewGrade.findAll({
      where: {
        reviewGradeId,
      },
      include: [{ model: db.User, attributes: ['username', 'picture'] }],
      order: ['updatedAt'],
      raw: true,
    })
  } catch (error) {
    debug.log('grade-service', error)
  }
  return comment
}
export async function finalDecisionReview(gradeId, userId, point, reviewGradeId) {
  const gradeUser = updateUserGrade(gradeId, userId, point)
  try {
    await db.ReviewGrade.update({ finalDecision: true }, { where: { id: reviewGradeId } })
  } catch (err) {
    debug.log('grade-ctrl', err)
  }
  return gradeUser
}
export default {
  getReviewGradebyId,
  getCommentReviewGrade,
  getReviewGrades,
  finalDecisionReview,
}
