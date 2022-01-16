import BaseCtrl from './base'
import { controller, get, post, put } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { hashPassword } from '../utils/crypto'
import db from '../models/index'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { validateEmail, checkPassword } from '../services/auth.service'
import { google } from 'googleapis'
import {
  sendEmail,
  generateVerifyEmailTemplate,
  generateResetPasswordEmailTemplate,
} from '../utils/mail'
import { ACCOUNT_STATUS, CLASSROOM_ROLE } from '../utils/constants'
import { auth, ensureRoles } from '../middleware'

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
        status: ACCOUNT_STATUS.ACTIVE,
      },
    })
    const checkEmailPending = await db.User.findOne({
      where: {
        email: String(email).toLowerCase(),
        status: ACCOUNT_STATUS.PENDING,
      },
    })
    if (checkUsername) {
      return res.status(400).json({ success: false, message: 'Username already exists. ' })
    }
    if (checkEmailActive) {
      return res.status(400).json({ success: false, message: 'Email already exists. ' })
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
        status: ACCOUNT_STATUS.PENDING,
      })

      newUser.password = undefined
      const activation_token = jwt.sign({ newUser }, process.env.ACTIVATION_TOKEN_SECRET, {
        expiresIn: '5m',
      })

      const url = `${process.env.FRONTEND_URL}/activateEmail/${activation_token}`
      const emailTemplate = generateVerifyEmailTemplate(url)
      sendEmail(email, emailTemplate)

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

      const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
      const { email, status } = user.newUser
      const checkEmail = await db.User.findOne({ where: { email: email } })
      if (checkEmail) {
        if (status === ACCOUNT_STATUS.ACTIVE) {
          return res.json({
            success: true,
            message: 'Email already activated. ',
          })
        }
        const activeUser = await db.User.update(
          { status: ACCOUNT_STATUS.ACTIVE },
          { where: { email: email } }
        )
        res.status(httpStatusCodes.CREATED).send({ success: true, message: 'Comfirm email sucess' })
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  @post('/login')
  async login(req, res, next) {
    await passport.authenticate('local', { session: false }, function (err, user, info) {
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

        if (user.status === ACCOUNT_STATUS.BAN) {
          return res.send({
            success: false,
            message: 'This User Have Been Banned',
          })
        }

        if (user.status === ACCOUNT_STATUS.PENDING) {
          return res.send({
            success: false,
            message: 'Activate Account First',
          })
        }

        return res.send({
          success: true,
          message: 'authentication succeeded',
          token,
          user,
        })
      })
    })(req, res, next)
  }

  @post('/google-login')
  async googleLogin(req, res) {
    try {
      const { tokenId } = req.body

      const account = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.LOGIN_GOOGLE_CLIENT_ID,
      })
      const { email } = account.payload
      const user = await db.User.findOne({
        where: { email: String(email).toLowerCase() },
      })
      if (user) {
        user.password = undefined
        const token = jwt.sign({ user }, process.env.SECRET || 'meomeo')
        const userData = user.dataValues
        res.send({ success: true, message: 'Login success', token, userData })
      } else {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Email invalid',
        })
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  @post('/google-signup')
  async googleSignUp(req, res) {
    try {
      const { tokenId } = req.body

      const account = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.LOGIN_GOOGLE_CLIENT_ID,
      })
      const { email, picture, family_name, given_name } = account.payload
      const checkUser = await db.User.findOne({
        where: { email: String(email).toLowerCase() },
      })
      if (checkUser) {
        res.status(400).json({ success: false, message: 'Email already exist' })
      } else {
        const password = email + process.env.SECRET
        const hash = await hashPassword(password)
        const newUser = await db.User.create({
          username: email,
          email,
          password: hash,
          firstName: given_name,
          lastName: family_name,
          status: ACCOUNT_STATUS.ACCOUNT_ACTIVE,
          picture: picture,
        })
        newUser.password = undefined
        const activation_token = jwt.sign({ newUser }, process.env.ACTIVATION_TOKEN_SECRET, {
          expiresIn: '5m',
        })
        res.status(httpStatusCodes.CREATED).send({
          success: true,
          message: 'authentication succeeded',
          activation_token,
        })
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  @post('/create', auth(), ensureRoles([CLASSROOM_ROLE.ADMIN]))
  async createAccount(req, res) {
    const { username, email, password, firstName, lastName, role } = req.body
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
        status: ACCOUNT_STATUS.ACTIVE,
      },
    })
    const checkEmailPending = await db.User.findOne({
      where: {
        email: String(email).toLowerCase(),
        status: ACCOUNT_STATUS.PENDING,
      },
    })
    if (checkUsername) {
      return res.status(400).json({ success: false, message: 'Username already exists. ' })
    }
    if (checkEmailActive) {
      return res.status(400).json({ success: false, message: 'Email already exists. ' })
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
        status: ACCOUNT_STATUS.PENDING,
        role,
      })

      newUser.password = undefined
      const activation_token = jwt.sign({ newUser }, process.env.ACTIVATION_TOKEN_SECRET, {
        expiresIn: '5m',
      })

      const url = `${process.env.FRONTEND_URL}/activateEmail/${activation_token}`
      const emailTemplate = generateVerifyEmailTemplate(url)
      sendEmail(email, emailTemplate)

      res.status(httpStatusCodes.CREATED).json({
        success: true,
        message: 'Create Success.',
      })
    } catch (err) {
      res.status(httpStatusCodes.BAD_REQUEST).send(err.message)
    }
  }
  @post('/forgot-password')
  async forgotPassword(req, res) {
    try {
      const { email } = req.body
      const checkUser = await db.User.findOne({
        where: { email: String(email).toLowerCase() },
      })
      if (!checkUser) {
        res.status(400).json({ success: false, message: 'Email does not exist' })
      }
      const activation_token = jwt.sign({ id: checkUser.id }, process.env.ACTIVATION_TOKEN_SECRET, {
        expiresIn: '5m',
      })
      const url = `${process.env.FRONTEND_URL}/resetpassword/${activation_token}`
      const emailTemplate = generateResetPasswordEmailTemplate(url)
      sendEmail(email, emailTemplate)
      res
        .status(httpStatusCodes.CREATED)
        .send({ success: true, message: 'Re-send the password, please check your email.' })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send(error.message)
    }
  }
  @post('/reset-password')
  async resetPassword(req, res) {
    try {
      const { activation_token, password } = req.body
      const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
      if (checkPassword(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password must at least 6 characters.',
        })
      }
      const hash = await hashPassword(password)
      await db.User.update({ password: hash }, { where: { id: user.id } })
      res
        .status(httpStatusCodes.CREATED)
        .send({ success: true, message: 'Change password success!' })
    } catch (error) {
      res.status(httpStatusCodes.BAD_REQUEST).send(error.message)
    }
  }
}
export default AuthCtrl
