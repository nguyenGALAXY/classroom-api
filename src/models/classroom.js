export default (sequelize, DataTypes) => {
  const schema = {
    name: {
      type: DataTypes.STRING
    }
  }

  const classroomModel = sequelize.define('Classroom', schema)

  return classroomModel
}
