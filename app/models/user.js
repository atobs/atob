var sequelize = require_app("models/model");

var User = sequelize.instance.define('User', { 
  tripcode: sequelize.STRING,
  tripname: sequelize.STRING
});

module.exports = User;
