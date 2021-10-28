export default (sequelize, DataTypes) => {
  const schema = {
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    ownerId: {
      allowNull: false,
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
