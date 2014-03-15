"use strict";

var sequelize = require_app("models/model");
var fakedata = require_app("fakedata");


module.exports = {
  setup_app: function() {
    sequelize.instance.sync({ force: true }).success(function() {
      console.log("Synced SQL DB to models"); 
      fakedata.generate();
    });

  },
  setup_request: function(req) {
    console.log("Handling request", req.path, req.query, req.params);
  },
  setup_plugins: function(app) {
    app.add_plugin_dir("app/plugins/slog");
    app.add_plugin_dir("app/plugins/tester");
  }
};
