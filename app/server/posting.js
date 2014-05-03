"use strict";

var REPLY_MAX = 200;
var POST_TIMEOUT = 20 * 1000;
var REPLY_TIMEOUT = 3 * 1000;
var REPLY_TIMEOUTS = {
  a: 10 * 1000

};

var POST_TIMEOUTS = {
  a: 30 * 1000
};

var UPDATE_LIMIT = 60 * 60 * 1000; // 1 hour editing timeout

var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");

var Ban = require_app("models/ban");
var Post = require_app("models/post");
var User = require_app("models/user");
var IP = require_app("models/ip");

var DOWNCONS = [
  ":thumbs-down:",
  ":law:",
  ":deathstar:",
  ":sage:"
];

var UPCONS = [
  ":thumbs-up:",
  ":batman:",
  ":ironman:",
  ":age:"
];


var escape_html = require("escape-html");
function handle_new_post(s, board, post, cb) {
  var last_post = s.last_post || 0;
  var post_timeout = POST_TIMEOUTS[board] || POST_TIMEOUT;
  var post_time = Date.now() - last_post ;
  if (post_time < post_timeout) {
    var delta = parseInt((post_timeout - post_time) / 1000, 10);
    // Need to message the client that they are submitting too fast...
    var msg = "There's a " + parseInt(post_timeout/1000, 10) +
      " second post timeout, please wait " + delta +
      " more second(s) before posting";
    s.emit("notif", msg, "warn");
    return;
  }

  s.last_post = Date.now();

  var title = post.title;
  var text = post.text;
  var tripcode = post.tripcode || "";
  var author = post.author || "anon";
  var data = {
    text: escape_html(text),
    title: escape_html(title),
    tripcode: gen_md5(author + ":" + tripcode),
    board_id: board,
    author: escape_html(author),
    replies: 0,
    downs: 0,
    ups: 0,
    bumped_at: Date.now()
  };

  is_user_banned(s, board, function(banned) {
    if (banned) {
      board = "ban";
      data.board_id = "ban";
    }

    Post.create(data)
      .success(function(p) {
        IP.create({
          post_id: p.id,
          ip: s.spark.address.ip,
          browser: s.spark.headers['user-agent']
        });

        data.post_id = p.id;
        s.broadcast.to(board).emit("new_post", data);
        s.emit("new_post", data);
        
        if (cb) {
          cb();
        }
      });
  });


  return Date.now();
}

function is_user_banned(s, board, done) {
  Ban.findAll({
    where: {
      ip: s.spark.address.ip,
      board: board
    }
  }).success(function(bans) {
    var banned = false;

    if (bans) {
      _.each(bans, function(b) {
        var hours = parseInt(b.hours, 10);
        if (!hours) {
          // Permabanned...
          banned = true;
          return;
        }

        var created_at = +new Date(b.created_at);
        var banned_until = created_at + (60 * 60 * hours * 1000);
        if (Date.now() - banned_until < 0) {
          banned = true;
        }
      });
    }

    done(banned);
  });
}

function handle_new_reply(s, board, post, cb) {
  var last_reply = s.last_reply || 0;
  var reply_timeout = REPLY_TIMEOUTS[board] || REPLY_TIMEOUT;
  var reply_time = Date.now() - last_reply ;
  if (reply_time < reply_timeout) {
    var delta = parseInt((reply_timeout - reply_time) / 1000, 10);
    // Need to message the client that they are submitting too fast...
    var msg = "There's a " + parseInt(reply_timeout/1000, 10) +
      " second reply timeout, please wait " + delta +
      " more second(s) before commenting";
    s.emit("notif", msg, "warn");
    s.emit("shake_post", post.post_id, reply_timeout - reply_time);
    return;
  }

  s.last_reply = Date.now();

  var author = post.author || "anon";
  var text = post.text.split("||");
  var title = "";
  if (text.length > 1) {
    title = text.shift();
    text = text.join("|");
  }

  // Do things to the parent, now...
  var down = false, up = false;

  _.each(DOWNCONS, function(downcon) {
    if (text.toString().match(downcon)) {
      down = true;
    }
  });

  _.each(UPCONS, function(upcon) {
    if (text.toString().match(upcon)) {
      up = true;
    }
  });


  Post.find({ where: { id: post.post_id }})
    .success(function(parent) {
      board = parent.board_id;

      is_user_banned(s, board, function(banned) {
        if (banned) {
          board = "ban";
          title = "reply to " + post.post_id + ":" + title;
        }



        if (!banned) {
          if (!down && parent.replies < REPLY_MAX) {
            parent.replies += 1;
            parent.bumped_at = Date.now();
          }

          if (down) {
            parent.downs += 1;
          }

          if (up) {
            parent.ups += 1;
          }

          parent.save();
        }


      Post.create({
          text: escape_html(text),
          title: escape_html(title),
          // null out thread and parent id on posts from banned user
          parent_id: banned ? null : post.post_id,
          thread_id: banned ? null : post.post_id,
          tripcode: gen_md5(author + ":" + post.tripcode),
          author: escape_html(author),
          board_id: board
        }).success(function(p) {
          p.dataValues.post_id = p.dataValues.id;
          p.dataValues.up = up;
          p.dataValues.down = down;
          delete p.dataValues.id;

          IP.create({
            post_id: p.dataValues.post_id,
            ip: s.spark.address.ip,
            browser: s.spark.headers['user-agent']
          });


          var boards_controller = load_controller("boards");
          var boards_socket = boards_controller.get_socket();
          boards_socket.broadcast.to(board).emit("new_reply", p.dataValues);

          // updating the posts controller, too, because its possible to
          // watch only one post
          var posts_controller = load_controller("posts");
          var post_socket = posts_controller.get_socket();
          post_socket.broadcast.to(board).emit("new_reply", p.dataValues);

          if (cb) {
            cb();
          }
        });

      });

  });
  return Date.now();
}

function handle_update_post(socket, board, post, cb) {
  if (board === "log" || board === "mod") {
    return;
  }

  if (!post.text || !post.text.trim()) {
    socket.emit("notif", "if you want to remove a post, use delete", "error");
    return;
  }

  Post.find({
    where: {
      id: post.id
    }
  }).success(function(result) {
    var delete_code = gen_md5(post.author + ':' + post.tripcode);
    if (result) {
      if (Date.now() - result.created_at > UPDATE_LIMIT) {
        socket.emit("notif", "this post was created over 1 hour ago and is no longer editable", "error");
        return;
      }

      if (result.tripcode === delete_code) {
        var action_name = "OP Updated post #";

        Post.create({
          board_id: "log",
          tripcode: delete_code,
          title: "update " + post.id,
          text: "**new text for #" + post.id + ":**\n\n" + escape_html(post.text) +  "\n\n\n\n**old text for #" + post.id + ":**\n\n " + result.text,
          author: post.author,
          bumped_at: Date.now()
        });

        result.text = escape_html(post.text);
        result.save();

        socket.emit("notif", action_name + post.id, "success");
        socket.emit("update_post", post.id, result.text);
        socket.broadcast.to(result.board_id).emit("update_post", post.id, result.text);

        if (cb) {
          cb();
        }

      } else {
        socket.emit("notif", "Can't update post #" + post.id + ", you didnt anon it", "error");
      }
    }
  });
}


function handle_delete_post(socket, board, post) {
  console.log("DELETING POST", post);
  Post.find({
    where: {
      id: post.id
    }
  }).success(function(result) {
    var delete_code = gen_md5(post.author + ':' + post.tripcode);
    if (result) {

      var action_name = "Reported post #";
      if (result.tripcode === delete_code) {
        action_name = "OP Deleted post #";

        Post.create({
          board_id: "log",
          tripcode: delete_code,
          title: "delete " + post.id,
          author: post.author,
          bumped_at: Date.now()
        });

        result.destroy();

        socket.emit("notif", action_name + post.id, "success");
        socket.emit("update_post", post.id);
        socket.broadcast.to(result.board_id).emit("update_post", post.id);
      } else {
        User.find({
          where: {
            tripname: post.author || "BOO", 
            tripcode: gen_md5(post.tripcode || "URNS")
          }
        }).success(function(user) {
          if (user) {
            socket.emit("notif", "Mod Deleted #" + post.id, "success");
            result.destroy();

            Post.create({
              board_id: "mod",
              tripcode: delete_code,
              title: "delete " + post.id,
              author: post.author,
              bumped_at: Date.now()
            });
            socket.emit("update_post", post.id);
            socket.broadcast.to(result.board_id).emit("update_post", post.id);

          } else {
            socket.emit("notif", action_name + post.id, "success");
            Post.create({
              board_id: "log",
              tripcode: delete_code,
              title: "report " + post.id,
              author: post.author,
              bumped_at: Date.now()
            });
          }
        });

      }

    } 

  });
}


module.exports = {
  handle_new_reply: handle_new_reply,
  handle_new_post: handle_new_post,
  handle_delete_post: handle_delete_post,
  handle_update_post: handle_update_post
};

