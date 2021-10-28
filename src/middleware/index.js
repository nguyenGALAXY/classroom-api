import passport from 'passport'

export function auth() {
  return (req, res, next) => {
    passport.authenticate('jwt', { session: false })(req, res, next)
  }
}
