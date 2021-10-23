import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'
import enVariables from '../config/database.json'

const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const config = enVariables[env]
const db = {}

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false
  })
}

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  )
  .forEach((file) => {
    // eslint-disable-next-line global-require
    const model = require(path.join(__dirname, file)).default(
      sequelize,
      Sequelize.DataTypes
    )
    db[model.name] = model
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

db.User.belongsToMany(db.Classroom, {
  through: db.ClassroomUser,
  foreignKey: 'userId'
})
db.Classroom.belongsToMany(db.User, {
  through: db.ClassroomUser,
  foreignKey: 'classroomId'
})

export default db
