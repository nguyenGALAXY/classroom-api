import BaseCtrl from './base'
import db from '../models/index'
import { controller, get, post, del, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { auth } from '../middleware'
import debug from 'src/utils/debug'
import _ from 'lodash'
import gradeService from 'src/services/grade.service'
import reviewGradeService from 'src/services/reviewGrade.service'
import classroomService from 'src/services/classroom.service'
import { CLASSROOM_ROLE, NOTIFICATION_STATUS } from 'src/utils/constants'

@controller('/api/notifications')
class NotificationCtrl extends BaseCtrl {
  @get('/', auth())
  async getNotifications(req, res) {
    const userId = req.user.id
    try {
      const notifications = await db.Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      })
      res.json(notifications)
    } catch (error) {
      debug.log('noti-ctrl', error.message)
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  }

  @put('/:id/status', auth())
  async changeStatus(req, res) {
    const notiId = req.params.id
    const { status } = req.body
    if (!notiId) {
      return res.status(httpStatusCodes.BAD_REQUEST)
    }
    try {
      let [_, result] = await db.Notification.update(
        { status },
        { where: { id: notiId }, returning: true }
      )

      result = result[0]
      // extract result from returning array

      return res.status(httpStatusCodes.OK).json(result)
    } catch (error) {
      debug.log('noti-ctrl', error.message)
      return res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).send('Error')
    }
  }
}
export default NotificationCtrl
