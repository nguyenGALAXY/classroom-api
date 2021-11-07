'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'ClassroomUsers', // table name
        'role', // column name
        // attributes
        {
          type: Sequelize.STRING,
        }
      ),
      queryInterface.addColumn('ClassroomUsers', 'active', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('ClassroomUsers', 'role'),
      queryInterface.removeColumn('ClassroomUsers', 'active'),
    ])
  },
}
