'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Classrooms', 'gradeId', {
        type: Sequelize.INTEGER,
      }),
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.removeColumn('Classrooms', 'gradeId')])
  },
}
