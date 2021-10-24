export default (sequelize, DataTypes) => {
  const schema = {
    name: {
      type: DataTypes.STRING,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id',
      },
    },
  }

  const classroomModel = sequelize.define('Classroom', schema)

  return classroomModel
}
