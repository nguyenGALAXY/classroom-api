export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      'GradeUsers',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        gradeId: {
          primaryKey: true,
          onDelete: 'CASCADE',
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Grades',
            key: 'id',
          },
          unique: 'grade_user_unique',
        },
        userId: {
          primaryKey: true,
          onDelete: 'CASCADE',
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id',
          },
          unique: 'grade_user_unique',
        },
        assignment: {
          type: Sequelize.STRING,
        },
        point: {
          type: Sequelize.FLOAT,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        uniqueKeys: {
          grade_user_unique: {
            fields: ['gradeId', 'userId'],
          },
        },
      }
    )
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('GradeUsers')
  },
}
