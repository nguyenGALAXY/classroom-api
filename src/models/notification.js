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
    content: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
  }

  const notificationModel = sequelize.define('Notification', schema)

  return notificationModel
}
