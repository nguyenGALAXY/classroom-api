'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('GradeUsers', 'reviewGradeId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'ReviewGrades',
        key: 'id',
      },
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('GradeUsers', 'reviewGradeId')
  },
}
