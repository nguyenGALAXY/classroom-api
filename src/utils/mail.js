import nodemailer from 'nodemailer'
import { google } from 'googleapis'

require('dotenv').config()
const { OAuth2 } = google.auth

//handle send mail
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground'
const oauth2Client = new OAuth2(
  process.env.MAILING_SERVICE_CLIENT_ID,
  process.env.MAILING_SERVICE_CLIENT_SECRET,
  process.env.MAILING_SERVICE_CLIENT_REFRESH_TOKEN,
  process.env.EMAIL_SENDER,
  OAUTH_PLAYGROUND
)

export const generateVerifyEmailTemplate = (url) => {
  return `
      <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
      <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Classroom</h2>
      <p>Congratulations! You're almost done.
          Just click the button below to validate your email address.
      </p>
      
      <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Verify your email</a>
  
      <p>If the button doesn't work for any reason, you can also click on the link below:</p>
  
      <div>${url}</div>
      </div>
  `
}

export const generateInviteTemplate = (url, role, classroom) => {
  return `
      <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
      <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Classroom</h2>
      <p>
          Invitation to join class ${classroom.name} with role ${role}
      </p>
      
      <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Join class</a>
  
      <p>If the button doesn't work for any reason, you can also click on the link below:</p>
  
      <div>${url}</div>
      </div>
  `
}

export const sendEmail = (to, template) => {
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
    html: template,
  }
  smtpTransport.sendMail(mailOption, (err, infor) => {
    if (err) {
      console.log(err)
    } else {
      console.log('Email sent: ' + infor.response)
    }
  })
}
