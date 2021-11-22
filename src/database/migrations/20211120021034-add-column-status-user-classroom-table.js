export default {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('ClassroomUsers', 'active'),
      queryInterface.addColumn('ClassroomUsers', 'status', {
        type: Sequelize.STRING,
      }),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('ClassroomUsers', 'active', {
        type: Sequelize.BOOLEAN,
      }),
      queryInterface.removeColumn('ClassroomUsers', 'status'),
    ])
  },
}
