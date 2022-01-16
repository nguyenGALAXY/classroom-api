export default (sequelize, DataTypes) => {
  const schema = {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    reviewGradeId: {
      onDelete: 'CASCADE',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ReviewGrades',
        key: 'id',
      },
    },
    content: {
      allowNull: false,
      type: DataTypes.STRING,
    },
  }

  const commentReviewGradeModel = sequelize.define('CommentReviewGrade', schema)

  return commentReviewGradeModel
}
