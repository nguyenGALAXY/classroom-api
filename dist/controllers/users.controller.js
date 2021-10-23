"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getUsers = getUsers;

require("core-js/modules/es.promise.js");

var _index = _interopRequireDefault(require("../models/index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getUsers(req, res, next) {
  const users = _index.default.User.findAll();

  res.send(users);
}

var _default = {
  getUsers
};
exports.default = _default;