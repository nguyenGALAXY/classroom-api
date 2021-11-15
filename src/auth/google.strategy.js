const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth').OAuthStrategy
import db from '../models/index'
require('dotenv').config()
passport.use(
  new GoogleStrategy(
    {
      consumerKey:
        '358036581199-d9odgr20b7jarvkv1falnsbq20cu2mt2.apps.googleusercontent.com',
      consumerSecret: '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',
      callbackURL: '/google_login/redirect',
    },
    () => {}
  )
)
