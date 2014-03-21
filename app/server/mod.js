"use strict";

var escape_html = require("escape-html");
var IP = require_app("models/ip");
var Post = require_app("models/post");
var User = require_app("models/user");
var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");
var config = require_core("server/config");

var OPS = {
  ban: function(duration) {

    return true;
  },
  delete: function() {
  
    return true;
  }
};

module.exports = {
  handle_new_post: function(socket, post) {
    if (!post.tripcode || !post.author) {
      return;
    }

    console.log("Handling new post", post);

    User.findAll({ 
      where: {
        tripcode: post.tripcode,
        tripname: post.author
      }
    }).success(function(user) {

      // Parse response to figure out what to do.
      // Format should be: 
      //
      // If the response goes unhandled, it should go to a different board
      // and do nothing here.
      var tokens = post.title.split(" ");

      var op = tokens.shift();

      var args = tokens;

      // all authors are renamed to "atob". no reason.
      post.author = "atob";
      post.text = escape_html(post.text);
      post.title = escape_html(post.title);
      var secret = config.mod_secret || "mod_secret";
      post.tripcode = gen_md5(post.tripcode + secret + post.tripname);

      var success = false;
      if (OPS[op]) {
        success = OPS[op].apply(null, args);
      }
  
      var board;
      if (success) {
        board = config.mod_board || 'modlog';
      } else {
        board = config.fail_board || 'coplog';
      }

      post.board_id = board;

      Post.create(post).success(function(p) {
        var boards_controller = load_controller("boards");
        var boards_socket = boards_controller.get_socket();
        p.dataValues.post_id = p.dataValues.id;
        delete p.dataValues.id;
        p.dataValues.client_options = _.clone(p.dataValues);

        boards_socket.broadcast.to(board).emit("new_post", p.dataValues);
      });

    });

  }
};
