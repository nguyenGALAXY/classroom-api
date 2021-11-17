module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Classrooms', 'section', {
        type: Sequelize.STRING,
      }),
      queryInterface.addColumn('Classrooms', 'subject', {
        type: Sequelize.STRING,
      }),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Classrooms', 'section'),
      queryInterface.removeColumn('Classrooms', 'subject'),
    ])
  },
}
