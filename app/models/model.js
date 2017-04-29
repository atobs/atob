var Sequelize = require("sequelize");

var archive = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'ab.sqlite',
  logging() { },
  define: {
    sync: { force: true },
    underscored: true
  }
});

var sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'db.sqlite',
  logging() { },
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
require_app("models/board_config");
require_app("models/action");

// If we are in RESET mode, we should load all models off the disk before finishing loading this file...
if (process.env.RESET) {
  // assume we are in root dir
  var cwd = process.cwd();
  var fs = require("fs");
  var paths = fs.readdirSync(cwd + "/app/models");

  console.log("LOADING ALL MODELS BECAUSE OF FIRST RUN");

  _.each(paths, path => {
    try {
      require_app("models/" + path.replace(/\.js/g, ''));

    } catch(e) {
      console.log(e);

    }

  });

}
