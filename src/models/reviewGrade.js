export default (sequelize, DataTypes) => {
  const schema = {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    gradeId: {
      onDelete: 'CASCADE',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Grades',
        key: 'id',
      },
    },
    explanation: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    expectationGrade: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    finalDecision: {
      type: DataTypes.BOOLEAN,
    },
  }

  const reviewGradeModel = sequelize.define('ReviewGrade', schema)

  return reviewGradeModel
}
