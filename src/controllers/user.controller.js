import BaseCtrl from './base'
import { controller, get, post, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import db from '../models/index'
import { auth } from '../middleware'
import { validatePhoneNumber } from '../services/validateService'
import isEmpty from 'lodash/isEmpty'
import debug from 'src/utils/debug'

const { Op } = require('sequelize')
@controller('/api/user')
class UserCtrl extends BaseCtrl {
  constructor() {
    super()
    this._ns = 'user-ctrl'
  }

  @get('/', auth())
  async getUserById(req, res) {
    try {
      const userId = req.user.id
      const user = await db.User.findOne({
        attributes: { exclude: ['password'] },
        where: { id: userId },
      })
      res.json(user)
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  }

  @put('/', auth())
  async updateUserInfo(req, res) {
    try {
      const userId = req.user.id
      let message = ''
      let { firstName, lastName, phone, studentId } = req.body
      //check student ID
      if (studentId) {
        const checkStudentId = await db.User.findOne({
          where: { id: { [Op.ne]: userId }, studentId: studentId },
        })
        if (checkStudentId) {
          message = 'Student ID already exist'
          studentId = null
        }
      }
      //check phone number
      if (phone) {
        const checkPhone = validatePhoneNumber(phone)
        if (!checkPhone) {
          message = 'Phone number invalid'
          phone = null
        }
      }
      await db.User.update(
        {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          studentId: studentId,
        },
        {
          where: { id: userId },
        }
      )
      const user = await db.User.findOne({
        attributes: { exclude: ['password'] },
        where: { id: userId },
      })
      res.json({ message: message, user })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  }

  @get('/:id', auth())
  async getUser(req, res) {
    const userId = req.params.id
    if (!userId) {
      return res.status(httpStatusCodes.BAD_REQUEST)
    }

    try {
      const user = await db.User.findByPk(userId, {
        attributes: {
          exclude: ['password'],
        },
        raw: true,
      })
      res.json(user)
    } catch (error) {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR, error.message)
    }
  }

  @get('/admin/users', auth())
  async getUsers(req, res) {
    let { roles } = req.query

    const queryObj = {}
    if (!isEmpty(roles)) {
      queryObj.role = { [Op.in]: roles }
    }

    try {
      const users = await db.User.findAll({
        attributes: { exclude: ['password'] },
        where: queryObj,
      })
      return res.json(users)
    } catch (error) {
      debug.log(this._ns, error.message)
      return res.status(httpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
export default UserCtrl
