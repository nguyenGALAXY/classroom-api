import passport from 'passport'
import db from 'src/models/index'

export function auth() {
  return (req, res, next) => {
    passport.authenticate('jwt', { session: false })(req, res, next)
  }
}

export function ensureRoles(roles = []) {
  return async (req, res, next) => {
    const userId = req.user.id
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    })

    const isHavingPermission = roles.includes(user.role)

    if (!isHavingPermission) {
      return res
        .status(httpStatusCodes.BAD_REQUEST)
        .send({ message: 'You do not have permissions to perform this action' })
    }

    next && (await next())
  }
}
