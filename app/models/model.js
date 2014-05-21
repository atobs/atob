var Sequelize = require("sequelize");

var archive = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'ab.sqlite',
  define: {
    sync: { force: true },
    underscored: true
  }
});

var sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'db.sqlite',
  define: {
    sync: { force: true },
    underscored: true
  }
});


module.exports = Sequelize;
module.exports.instance = sequelize;
module.exports.archive = archive;

// all models defined need to be required somewhere before the main setup is called
require_app("models/post");
require_app("models/user");
require_app("models/board");
