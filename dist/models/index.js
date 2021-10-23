"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _database = _interopRequireDefault(require("../config/database.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const basename = _path.default.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const config = _database.default[env];
const db = {};
let sequelize;

if (config.use_env_variable) {
  sequelize = new _sequelize.default(process.env[config.use_env_variable], config);
} else {
  sequelize = new _sequelize.default(config.database, config.username, config.password, config);
}

_fs.default.readdirSync(__dirname).filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js').forEach(file => {
  // eslint-disable-next-line global-require
  const model = require(_path.default.join(__dirname, file)).default(sequelize, _sequelize.default.DataTypes);

  db[model.name] = model;
});

db.sequelize = sequelize;
db.Sequelize = _sequelize.default;
db.User.belongsToMany(db.Classroom, {
  through: 'ClassroomUsers'
});
db.Classroom.belongsToMany(db.User, {
  through: 'ClassroomUsers'
});
var _default = db;
exports.default = _default;