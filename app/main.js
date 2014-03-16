"use strict";

var sequelize = require_app("models/model");
var fakedata = require_app("fakedata");
var Board = require_app("models/board");
var config = require_core("server/config");


var DEFAULT_BOARDS = [
  { 
    code: "a"
  },
  { 
    code: "b"
  },
  { 
    code: "c"
  }
];
module.exports = {
  setup_app: function() {
    var force_reset = process.env.RESET;
    sequelize.instance.sync({ force: force_reset }).success(function() {
      console.log("Synced SQL DB to models"); 

      if (process.env.FAKEDATA) {
        fakedata.generate();
      } else {
        _.each(config.boards || DEFAULT_BOARDS, function(board) {
          Board.findOrCreate({
            name: board.code,
            title: board.title
          });
        });
      }
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
