"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es.promise.js");

var _default = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ClassroomUsers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        primaryKey: true,
        onDelete: 'CASCADE',
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      classroomId: {
        primaryKey: true,
        onDelete: 'CASCADE',
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Classrooms',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ClassroomUsers');
  }
};
exports.default = _default;