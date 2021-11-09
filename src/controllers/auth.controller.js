import BaseCtrl from './base'
import { controller, get, post } from 'route-decorators'
import httpStatusCodes from 'http-status-codes'
import { hashPassword } from '../utils/crypto'
import db from '../models/index'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
require('dotenv').config()

@controller('/api/auth')
class AuthCtrl extends BaseCtrl {
  @post('/register')
  async register(req, res) {
    const { username, email, password, firstName, lastName } = req.body
    const hash = await hashPassword(password)
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: 'Invalid email' })
    }
    const checkUser = await db.User.findOne({ where: { username: username } })
    if (checkUser) {
      return res.status(400).json({ msg: 'Username already exists. ' })
    }
    try {
      const newUser = {
        username,
        email,
        password: hash,
        firstName,
        lastName,
      }
      const activation_token = jwt.sign(
        { newUser },
        process.env.ACTIVATION_TOKEN_SECRET,
        { expiresIn: '5m' }
      )
      const url = `${process.env.API_URL}/api/auth/activateEmail/${activation_token}`
      sendEmail(email, url)

      res.status(httpStatusCodes.CREATED).json({
        msg: 'Register Success! Please activate your email to start.',
      })
      //res.status(httpStatusCodes.CREATED).send(newUser)
    } catch (err) {
      res.status(httpStatusCodes.BAD_REQUEST).send(err.message)
    }
  }
  @post('/activateEmail')
  async activateEmail(req, res) {
    try {
      const { activation_token } = req.body
      console.log(activation_token)
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      )
      const { username, password, email, firstName, lastName } = user.newUser
      const newUser = await db.User.create({
        username,
        email,
        password,
        firstName,
        lastName,
      })
      res.status(httpStatusCodes.CREATED).send(newUser)
    } catch (err) {
      return res.status(500).json({ msg: err.message })
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

//check valid email function
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}
//handle send mail
const { OAuth2 } = google.auth
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground'
const oauth2Client = new OAuth2(
  process.env.MAILING_SERVICE_CLIENT_ID,
  process.env.MAILING_SERVICE_CLIENT_SECRET,
  process.env.MAILING_SERVICE_CLIENT_REFRESH_TOKEN,
  process.env.EMAIL_SENDER,
  OAUTH_PLAYGROUND
)

const sendEmail = (to, url) => {
  oauth2Client.setCredentials({
    refresh_token: process.env.MAILING_SERVICE_CLIENT_REFRESH_TOKEN,
  })
  const accessToken = oauth2Client.getAccessToken()
  const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_SENDER,
      clientId: process.env.MAILING_SERVICE_CLIENT_ID,
      clientSecret: process.env.MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: process.env.MAILING_SERVICE_CLIENT_REFRESH_TOKEN,
      accessToken,
    },
  })
  const mailOption = {
    from: process.env.EMAIL_SENDER,
    to: to,
    subject: 'Classroom Project',
    html: `
    <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
    <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Classroom</h2>
    <p>Congratulations! You're almost done.
        Just click the button below to validate your email address.
    </p>
    
    <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Verify your email</a>

    <p>If the button doesn't work for any reason, you can also click on the link below:</p>

    <div>${url}</div>
    </div>
`,
  }
  smtpTransport.sendMail(mailOption, (err, infor) => {
    if (err) {
      console.log(err)
    } else {
      console.log('Email sent: ' + infor.response)
    }
  })
}
export default AuthCtrl
