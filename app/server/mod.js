"use strict";

var escape_html = require("escape-html");
var IP = require_app("models/ip");
var Post = require_app("models/post");
var User = require_app("models/user");
var Ban = require_app("models/ban");
var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");
var config = require_core("server/config");
var post_links = require_app("server/post_links");
var board_names = require_app("server/board_names");

var BoardClaim = require_app("models/board_claim");

var OPS = {
  ban: function(post, hours) {
    hours = parseInt(hours, 10) || 24;

    IP.find({where: { post_id: post.id} })
      .success(function(ip) {
        if (!ip) {
          return;
        }

        post.title = "[banned from " + post.board_id + "] " + post.title;
        var old_board_id = post.board_id;

        post.board_id = board_names.BAN;
        post.parent_id = null;
        post.thread_id = null;

        post.save();
        Ban.create({
          ip: ip.ip,
          browser: ip.browser,
          hours: hours,
          board: old_board_id
        });
      });

    return true;
  },
  delete: function(post) {
    post_links.erase_links(post);
    post.destroy();
    return true;
  },
  accept: function(post) {
    // accept an anon's mod request to become a moderator for a board
    var board_claim = "Anon claims /";
    var board = post.title.replace(board_claim, "");

    BoardClaim.find({
      where: {
        board_id: board,
        author: post.author,
        tripcode: post.tripcode,
        accepted: null
      }
    }).success(function(claim) {
      if (claim) {
        claim.accepted = true;
        claim.save();
      }
    });


    return true;
  }
};

function post_text(result, op) {
  var text = "";
  if (op && op.trim()) {
    text += "**ACTION** " + op + "\n";
  }

  if (result.title.trim()) {
    text += "**TITLE** " + result.title + "\n";
  }
  if (result.text.trim()) {
    text += "**TEXT** " + result.text + "\n";
  }
  return text;
}

module.exports = {
  handle_new_post: function(socket, post) {
    if (!post.tripcode || !post.author) {
      return;
    }

    console.log("Handling new post", post);

    User.find({
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
      var text = post.title || post.text;
      var tokens = text.split(" ");

      var op = tokens.shift();
      var post_id = tokens.shift();

      if (!post_id) {
        socket.emit("notif", "No POST_ID specified, can't post to board");
        return;
      }

      Post.find({
        where: {
          id: post_id
        }}).success(function(p) {
          if (!p) {
            socket.emit("notif", "couldn't find post, " + post_id);
            return;
          }

          var args = tokens;
          args.unshift(p);

          // all authors are renamed to "atob". no reason.
          post.text = escape_html(post.text || p.dataValues.text);
          post.title = escape_html(post.title || "");
          if (user) {
            post.author = "atob";
          }
          var secret = config.mod_secret || "mod_secret";

          post.tripcode = gen_md5(post.author + secret + post.tripcode);
          post.bumped_at = Date.now();
          post.text = post_text(p, op);

          var success = false;
          if (OPS[op] && p && user) {
            success = OPS[op].apply(null, args);
          }

          var board;
          if (success && user) {
            board = config.mod_board || board_names.MOD;
            socket.emit("notif", op + " success. all hail JAMES", "success");
          } else {
            board = config.fail_board || board_names.COP;
            socket.emit("notif", op + " failure. the JAMES knows all", "warn");
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


    });

  }

};
