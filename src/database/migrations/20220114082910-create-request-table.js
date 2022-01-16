export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReviewGrades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ownerId: {
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      gradeId: {
        onDelete: 'CASCADE',
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Grades',
          key: 'id',
        },
      },
      explanation: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      expectationGrade: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      finalDecision: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ReviewGrades')
  },
}
