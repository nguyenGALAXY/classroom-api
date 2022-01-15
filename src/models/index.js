import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'
import enVariables from '../config/database.js'

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
    logging: false,
  })
}

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach((file) => {
    // eslint-disable-next-line global-require
    const model = require(path.join(__dirname, file)).default(sequelize, Sequelize.DataTypes)
    db[model.name] = model
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

db.User.hasMany(db.Classroom, { foreignKey: 'ownerId' })
db.User.hasMany(db.ClassroomUser, { foreignKey: 'userId' })
db.User.hasMany(db.GradeUser, { foreignKey: 'userId' })

db.Classroom.belongsTo(db.User, { foreignKey: 'ownerId', as: 'Owner' })
db.Classroom.hasMany(db.ClassroomUser, { foreignKey: 'classroomId' })
db.Classroom.hasMany(db.Grade, { foreignKey: 'classroomId' })

db.ClassroomUser.belongsTo(db.User, { foreignKey: 'userId' })
db.ClassroomUser.belongsTo(db.Classroom, { foreignKey: 'classroomId' })

db.Grade.hasMany(db.GradeUser, { foreignKey: 'gradeId' })

db.GradeUser.belongsTo(db.Grade, { foreignKey: 'gradeId' })
db.GradeUser.belongsTo(db.User, { foreignKey: 'userId' })
db.GradeUser.belongsTo(db.ReviewGrade, { foreignKey: 'gradeId' })

db.ReviewGrade.belongsTo(db.User, { foreignKey: 'ownerId' })
db.ReviewGrade.belongsTo(db.Grade, { foreignKey: 'gradeId' })
db.ReviewGrade.belongsTo(db.GradeUser, { foreignKey: 'gradeId' })

db.ReviewGrade.hasMany(db.CommentReviewGrade, { foreignKey: 'reviewGradeId' })

db.CommentReviewGrade.belongsTo(db.ReviewGrade, { foreignKey: 'reviewGradeId' })
db.CommentReviewGrade.belongsTo(db.User, { foreignKey: 'userId' })
export default db
