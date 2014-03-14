var Sequelize = require("sequelize");

var sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'db.sqlite',
  define: {
    sync: { force: true },
  }
});

module.exports = Sequelize;
module.exports.instance = sequelize;

// all models defined need to be required somewhere before the main setup is called
require_app("models/post");
require_app("models/user");
require_app("models/board");
