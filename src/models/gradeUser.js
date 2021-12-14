export default (sequelize, DataTypes) => {
  const schema = {
    gradeId: {
      primaryKey: true,
      onDelete: 'CASCADE',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Grade',
        key: 'id',
      },
    },
    userId: {
      primaryKey: true,
      onDelete: 'CASCADE',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    assignment: {
      type: DataTypes.STRING,
    },
    point: {
      type: DataTypes.FLOAT,
    },
  }

  const gradeUserModel = sequelize.define('GradeUser', schema)

  return gradeUserModel
}
