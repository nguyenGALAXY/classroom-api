'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('ClassroomUsers', 'fullName', {
      type: Sequelize.STRING,
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ClassroomUsers', 'fullName')
  },
}
