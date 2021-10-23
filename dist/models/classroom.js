"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _default = (sequelize, DataTypes) => {
  const schema = {
    name: {
      type: DataTypes.STRING
    }
  };
  const classroomModel = sequelize.define('Classroom', schema);
  return classroomModel;
};

exports.default = _default;