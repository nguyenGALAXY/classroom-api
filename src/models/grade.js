export default (sequelize, DataTypes) => {
  const schema = {
    classroomId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Classroom',
        key: 'id',
      },
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    point: {
      allowNull: false,
      type: DataTypes.FLOAT,
    },
    index: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
  }

  const gradeModel = sequelize.define('Grade', schema)

  return gradeModel
}
