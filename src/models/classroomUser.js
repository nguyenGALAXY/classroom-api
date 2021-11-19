export default (sequelize, DataTypes) => {
  const schema = {
    classroomId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Classroom',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }

  const classroomUserModel = sequelize.define('ClassroomUser', schema)

  return classroomUserModel
}
