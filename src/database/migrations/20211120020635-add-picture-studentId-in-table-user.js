'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'studentId', {
        type: Sequelize.STRING,
      }),
      queryInterface.addColumn('Users', 'picture', {
        type: Sequelize.STRING,
      }),
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'picture'),
      queryInterface.removeColumn('Users', 'studentId'),
    ])
  },
}
