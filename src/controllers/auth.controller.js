import BaseCtrl from './base'
import { controller, get, post } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { hashPassword } from '../utils/crypto'
import db from '../models/index'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import {
  validateEmail,
  sendEmail,
  checkPassword,
} from '../services/authService'
import { google } from 'googleapis'
import * as accountStatus from '../utils/constants'
require('dotenv').config()
const { OAuth2 } = google.auth
const client = new OAuth2(process.env.LOGIN_GOOGLE_CLIENT_ID)
@controller('/api/auth')
class AuthCtrl extends BaseCtrl {
  @post('/register')
  async register(req, res) {
    const { username, email, password, firstName, lastName } = req.body
    const hash = await hashPassword(password)
    //Validate and check acc
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' })
    }
    const checkUsername = await db.User.findOne({
      where: { username: username },
    })
    const checkEmailActive = await db.User.findOne({
      where: {
        email: String(email).toLowerCase(),
        status: accountStatus.ACCOUNT_ACTIVE,
      },
    })
    const checkEmailPending = await db.User.findOne({
      where: {
        email: String(email).toLowerCase(),
        status: accountStatus.ACCOUNT_PENDING,
      },
    })
    if (checkUsername) {
      return res
        .status(400)
        .json({ success: false, message: 'Username already exists. ' })
    }
    if (checkEmailActive) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already exists. ' })
    }
    if (checkEmailPending) {
      return res.status(400).json({
        success: false,
        message: 'Email was not active, please check your email to activate. ',
      })
    }
    if (checkPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must at least 6 characters.',
      })
    }
    try {
      const newUser = await db.User.create({
        username,
        email,
        password: hash,
        firstName,
        lastName,
        status: accountStatus.ACCOUNT_PENDING,
      })
      newUser.password = undefined
      const activation_token = jwt.sign(
        { newUser },
        process.env.ACTIVATION_TOKEN_SECRET,
        { expiresIn: '5m' }
      )
      const url = `${process.env.FRONTEND_URL}/activateEmail/${activation_token}`
      sendEmail(email, url)

      res.status(httpStatusCodes.CREATED).json({
        success: true,
        message: 'Register Success! Please check your email to activate.',
      })
    } catch (err) {
      res.status(httpStatusCodes.BAD_REQUEST).send(err.message)
    }
  }
  @post('/activate-email')
  async activateEmail(req, res) {
    try {
      const { activation_token } = req.body

      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      )
      const { email, status } = user.newUser
      const checkEmail = await db.User.findOne({ where: { email: email } })
      if (checkEmail) {
        if (status === accountStatus.ACCOUNT_ACTIVE) {
          return res
            .status(400)
            .json({ success: true, message: 'Email already activated. ' })
        }
        const activeUser = await db.User.update(
          { status: accountStatus.ACCOUNT_ACTIVE },
          { where: { email: email } }
        )
        res
          .status(httpStatusCodes.CREATED)
          .send({ success: true, message: 'Comfirm email sucess' })
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
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
          return res.send({
            success: false,
            message: 'Incorrect username or password',
          })
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
  @post('/google-login')
  async googleLogin(req, res) {
    try {
      const { tokenId } = req.body

      const account = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.LOGIN_GOOGLE_CLIENT_ID,
      })
      const { email, name, family_name, given_name } = account.payload
      const password = email + process.env.SECRET
      const hash = await hashPassword(password)
      const user = await db.User.authenticate(email, password)
      if (user) {
        user.password = undefined
        const token = jwt.sign({ user }, process.env.SECRET || 'meomeo')
        res.send({ success: true, message: 'Login success', token })
      } else {
        //check email exist
        const checkEmail = await db.User.findOne({
          where: { email: String(email).toLowerCase() },
        })
        if (checkEmail) {
          return res
            .status(400)
            .json({ success: false, message: 'Email already exists. ' })
        }
        const newUser = await db.User.create({
          username: email,
          email,
          password: hash,
          firstName: given_name,
          lastName: family_name,
          status: accountStatus.ACCOUNT_ACTIVE,
        })
        const user = await db.User.authenticate(email, password)
        user.password = undefined
        const token = jwt.sign({ user }, process.env.SECRET || 'meomeo')
        return res.send({
          success: true,
          message: 'authentication succeeded',
          token,
        })
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
export default AuthCtrl
