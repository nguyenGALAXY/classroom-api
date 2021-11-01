import BaseCtrl from './base'
import { controller, get, post } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { hashPassword } from '../utils/crypto'
import db from '../models/index'
import passport from 'passport'
import jwt from 'jsonwebtoken'

@controller('/api/auth')
class AuthCtrl extends BaseCtrl {
  @post('/register')
  async register(req, res) {
    const { username, email, password, firstName, lastName } = req.body
    const hash = await hashPassword(password)
    try {
      const newUser = await db.User.create({
        username,
        email,
        password: hash,
        firstName,
        lastName,
      })
      newUser.password = undefined
      res.status(httpStatusCodes.CREATED).send(newUser)
    } catch (err) {
      res.status(httpStatusCodes.BAD_REQUEST).send(err.message)
    }
  }

  @post('/login')
  async login(req, res, next) {
    await passport.authenticate(
      'local',
      { session: false },
      function (err, user, info) {
        if (err) {
          return next(err)
        }
        if (!user) {
          return res.send({ success: false, message: 'authentication failed' })
        }
        req.logIn(user, { session: false }, (loginErr) => {
          if (loginErr) {
            return next(loginErr)
          }
          user.password = undefined
          const token = jwt.sign({ user }, process.env.SECRET || 'meomeo')
          return res.send({
            success: true,
            message: 'authentication succeeded',
            token,
          })
        })
      }
    )(req, res, next)
  }
}

export default AuthCtrl
