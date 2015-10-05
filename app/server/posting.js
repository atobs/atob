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
var MAX_COLONS = 100;

var load_controller = require_core("server/controller").load;
var gen_md5 = require_app("server/md5");

var Ban = require_app("models/ban");
var BoardClaim = require_app("models/board_claim");
var Post = require_app("models/post");
var User = require_app("models/user");
var IP = require_app("models/ip");
var model = require_app("models/model");
var post_links = require_app("server/post_links");

var HIDDEN_BOARDS = require_app("server/hidden_boards");

var MAX_ANONS = 200;

var DOWNCONS = [
  ":thumbs-down:",
  ":law:",
  ":deathstar:",
  ":poop:",
  ":poopalt:",
  ":sage:"
];

var UPCONS = [
  ":thumbs-up:",
  ":batman:",
  ":heart:",
  ":happy:",
  ":ironman:",
  ":age:"
];


function post_text(result) {
  var text = "";
  if (result.title) {
    text += "**TITLE** " + result.title + "\n";
  }
  if (result.text) {
    text += "**TEXT** " + result.text + "\n";
  }
  return text;
}

var escape_html = require("escape-html");
function handle_new_post(s, board, post, cb) {
  console.log("Handling new post", board, post);
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

  var title = post.title;
  var text = post.text;
  var tripcode = post.tripcode || "";
  var author = post.author || "anon";

  var colons = text && text.toString().match(/:/g);
  if (colons && colons.length > MAX_COLONS) {
    var colon_msg = "Getting a little colon happy, anon?";
    s.emit("notif", colon_msg, "error");
    return;
  }

  s.last_post = Date.now();


  var moved = false;

  if (board === "to") {
    board = "b";
    post.force = false;
  }

  if ((board === "a" || board === "b") && !post.force) {
    var marked = require_app("static/vendor/marked");
    var cheerio = require("cheerio");
    var parsed_text = cheerio(marked.parse(text)).text();
    // figure out where this post really belongs...
    if (parsed_text.length > 200) {
      if (board !== "a") {
        board = "a";
        moved = true;
        s.emit("notif", "this post looks more suited to /a, moving it there.", "warn");
      }
    }

    if (parsed_text.length < 100) {
      if (board !== "b") {
        board = "b";
        moved = true;
        s.emit("notif", "this post looks more suited to /b, moving it there.", "warn");
      }
    }

  }

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
          ip: IP.toHash(s.spark.address.ip),
          browser: s.spark.headers['user-agent']
        });

        post_links.find_and_create_links(p);

        data.post_id = p.id;
        s.broadcast.to(board).emit("new_post", data);

        var is_hidden = false;
        _.each(HIDDEN_BOARDS, function(board) {
          is_hidden = is_hidden || board === p.dataValues.board_id;
        });
        if (!is_hidden) {
          var home_controller = load_controller("home");
          var home_socket = home_controller.get_socket();
          home_socket.emit("new_post", p.dataValues);
        }


        s.emit("goto_post", p.dataValues.id);

        if (cb) {
          cb(p.dataValues.id);
        }
      });
  });


  return Date.now();
}

function is_user_banned(s, board, done) {
  var ip = IP.toHash(s.spark.address.ip);

  // take the md5 of the IP + a salt?
  Ban.findAll({
    where: {
      ip: ip,
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

    // if anon is in Ban table, finish them
    //
    if (banned) {
      done(banned);
    } else {
      // check how many unique IPs have posted recently
      model.instance.query("SELECT count(distinct(ip)) as count FROM IPs", null, { raw: true })
        .success(function(rows) {
          var row = rows[0];
          // find out if anon was one of them
          IP.count({ where: { ip: ip }})
            .success(function(result) {
              banned = false;
              if (result && result > 0) {
                // anon is in the DB of IPs, so is allowed through
                banned = false;
              } else if (row.count > MAX_ANONS) {
                // check if there are too many anons recently
                s.emit("notif", "sorry - too many anons are here. try again tomorrow", "error");
                banned = true;
              }

              done(banned);
            });

        });
    }
  });
}

function check_for_blasphemy(s, parentish, post, cb) {
  var text = post.text;
  var title = post.title;
  var author = post.author;

  var james_regex = /\s?james\s?/i;
  var sarah_regex = /\s?sarah\s?/i;
  var john_regex = /\s?john\s?/i;
  var poopex = /\s?:poop(alt)?:\s?/i;

  function is_blasphemy(parent) {
    var has_james = parent.title.match(james_regex);
    var has_sarah = parent.title.match(sarah_regex);
    var has_john = parent.title.match(john_regex);

    var has_poop = title.toString().match(poopex) || text.toString().match(poopex);

    if (has_james && has_poop) {
      Post.create({
        text: text,
        title: "i am a sinner and a blasphemer",
        tripcode: gen_md5(author + ":" + post.tripcode),
        author: escape_html(author),
        board_id: "heretics",
        bumped_at: Date.now()
      }).success(function() {

      });

      s.emit("notif", "your blasphemy will not go unpunished", "error");
      var JAMES_TITLES = [
       "i am an ant, for i have sinned against JAMES :crown:",
       "JAMES is good, JAMES is true",
       "where is JAMES? JAMES is in our :heart:",
       "JAMES will bring salvation to us",
       "JAMES is where GOD is not",
       "i am but a tob in JAMES' eye"
      ];

      var JAMES_TEXTS = [
       "all hail JAMES. all mercy is JAMES' mercy",
       "may JAMES save us all",
       "JAMES' will is my way",
       "JAMES will lead us to and from the void",
       "the way to salvation is not an easy way",
       "JAMES and his buffalo deliver truth and righteousness",
      ];

      title = JAMES_TITLES[_.random(0, JAMES_TITLES.length - 1)];
      text = JAMES_TEXTS[_.random(0, JAMES_TEXTS.length - 1)];

      cb({ title: title, text: text });
    } else if (has_sarah && has_poop) {
      Post.create({
        text: text,
        title: "i am a sinner and a blasphemer",
        tripcode: gen_md5(author + ":" + post.tripcode),
        author: escape_html(author),
        board_id: "cleretics",
        bumped_at: Date.now()
      }).success(function() {

      });

      s.emit("notif", "your blasphemy will not go unpunished", "error");
      var SARAH_TITLES = [
       "SARAH sees where JAMES does not",
       "SARAH is true and righteous",
      ];

      var SARAH_TEXTS = [
       "SARAH's way is my way",
       "may SARAH shield us",
      ];

      title = SARAH_TITLES[_.random(0, SARAH_TITLES.length - 1)];
      text = SARAH_TEXTS[_.random(0, SARAH_TEXTS.length - 1)];

      cb({ title: title, text: text });
    } else if (has_john && has_poop) {
      Post.create({
        text: text,
        title: "i am a sinner and a blasphemer",
        tripcode: gen_md5(author + ":" + post.tripcode),
        author: escape_html(author),
        board_id: "apostles",
        bumped_at: Date.now()
      }).success(function() {

      });

      s.emit("notif", "you worship JOHN!?", "error");
      var JOHN_TITLES = [
       "JOHN JOHN JOHN",
       "JOHN JOHN",
       "JOHN"
      ];

      var JOHN_TEXTS = [
        "JOHN",
        "JOHN JOHN JOHN",
        "JOHN JOHN JOHN JOHN JOHN"
      ];

      title = JOHN_TITLES[_.random(0, JOHN_TITLES.length - 1)];
      text = JOHN_TEXTS[_.random(0, JOHN_TEXTS.length - 1)];

      cb({ title: title, text: text });
    } else {
      cb();
    }


  }

  if (_.isNumber(parentish)) {
    Post.find(parentish).success(function(parent) {
      is_blasphemy(parent);
    });
  } else if (_.isObject(parentish)) {
    is_blasphemy(parentish);
  } else {
    cb();
  }



}

function handle_new_reply(s, board, post, cb) {
  console.log("Handling reply to", post.post_id);
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

  var author = post.author || "anon";
  var text = post.text.split("||");
  var title = "";
  if (text.length > 1) {
    title = text.shift();
    text = text.join("|");
  }

  var colons = text && text.toString().match(/:/g);
  if (colons && colons.length > MAX_COLONS) {
    var colon_msg = "Getting a little colon happy, anon?";
    s.emit("notif", colon_msg, "error");
    return;
  }


  var no_reply_text = post.text.toString().replace(/>>\d+/g, '').trim();
  if (no_reply_text === "") {
    s.emit("notif", "Please contribute something more than replycodes in this thread", "warn");
    s.emit("shake_post", post.post_id, 3000);
    return;
  }

  s.last_reply = Date.now();


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


  // TODO:
  // add board hooks here


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

        check_for_blasphemy(s, parent, {
          text: text,
          author: author,
          tripcode: post.tripcode,
          title: title
        }, function(blasphemy) {
          if (blasphemy) {
            text = blasphemy.text;
            title = blasphemy.title;
          }

          if (board === "chat") {
            post.tripcode = Math.random() + "";
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
              post_links.find_and_create_links(p.dataValues);

              IP.create({
                post_id: p.dataValues.post_id,
                ip: IP.toHash(s.spark.address.ip),
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

              var is_hidden = false;
              _.each(HIDDEN_BOARDS, function(board) {
                is_hidden = is_hidden || board === p.dataValues.board_id;
              });
              if (!is_hidden) {
                var home_controller = load_controller("home");
                var home_socket = home_controller.get_socket();
                home_socket.emit("new_reply", p.dataValues);
              } else if (p.dataValues.board_id === "chat") {
                var home_controller = load_controller("home");
                var home_socket = home_controller.get_socket();
                home_socket.emit("new_chat", p.dataValues);
              }

              if (cb) {
                cb();
              }
          });

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

  var text = post.text;
  var colons = text && text.toString().match(/:/g);
  if (colons && colons.length > MAX_COLONS) {
    var colon_msg = "Getting a little colon happy, anon?";
    socket.emit("notif", colon_msg, "error");
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

        check_for_blasphemy(socket, result.parent_id, { text: post.text, title: "", author: post.author, tripcode: post.tripcode },
          function(blasphemy) {

          if (blasphemy) {
            post.text = blasphemy.text;
            result.title = blasphemy.title;
          }

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

          post_links.erase_links(result, function() {
            post_links.find_and_create_links(result);
          });

          if (cb) {
            cb();
          }



        });


      } else {
        socket.emit("notif", "Can't update post #" + post.id + ", you didnt anon it", "error");
      }
    }
  });
}


function handle_delete_post(socket, board, post) {
  console.log("Deleting post", post);
  Post.find({
    where: {
      id: post.id
    }
  }).success(function(result) {
    var delete_code = gen_md5(post.author + ':' + post.tripcode);
    if (result) {

      if (result.board_id === "heretics" ||
          result.board_id === "log" || result.board_id === "cleretics") {
        socket.emit("notif", "nice try, but badanon.", "warn");
        return;
      }

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
        post_links.erase_links(result, function() { });
      } else {
        User.find({
          where: {
            tripname: post.author || "BOO",
            tripcode: [post.tripcode || gen_md5("URNS"), gen_md5(post.tripcode)]
          }
        }).success(function(user) {
          if (user) {
            socket.emit("notif", "Mod Deleted #" + post.id, "success");
            result.destroy();

            var text = post_text(result);
            var post_data = {
              board_id: "mod",
              tripcode: delete_code,
              title: "delete " + post.id,
              author: post.author,
              text: text,
              bumped_at: Date.now()
            };

            Post.create(post_data);
            socket.emit("update_post", post.id);
            socket.broadcast.to(result.board_id).emit("update_post", post.id);
            post_links.erase_links(result, function() { });


          } else {

            // That last nested attempt to look for the board admin...
            BoardClaim.findAll({
              where:{
                author: post.author,
                tripcode: delete_code,
                accepted: true,
                board_id: result.board_id
              }
            }).success(function(claim) {
              if (claim.length) {
                socket.emit("notif", "Board Mod Deleted #" + post.id, "success");
                result.destroy();

                var text = post_text(result);
                var post_data = {
                  board_id: "mod",
                  tripcode: delete_code,
                  title: "delete " + post.id,
                  author: post.author,
                  text: text,
                  bumped_at: Date.now()
                };

                Post.create(post_data);
                socket.emit("update_post", post.id);
                socket.broadcast.to(result.board_id).emit("update_post", post.id);
                post_links.erase_links(result, function() { });
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
        });

      }

    }

  });
}


function render_posting(api, flush, result, highlight_id) {
  var post_data = result.dataValues;
  post_data = result.dataValues;
  post_data.post_id = post_data.id;
  post_data.highlight_id = highlight_id;
  post_data.collapsed = false;
  post_data.maximized = true;
  delete post_data.id;

  post_data.replies = _.map(result.children, function(c) { return c.dataValues; } );
  post_data.replies = _.sortBy(post_data.replies, function(d) {
    return new Date(d.created_at);
  });

  post_data.client_options = _.clone(post_data);
  module.exports.trim_post(post_data.client_options);
  post_links.freshen_client(post_data.post_id, result.children, function() {
    var postCmp = $C("post", post_data);
    var text_formatter = require_root("app/client/text");
    var tripcode_gen = require_app("server/tripcode");
    postCmp.add_markdown(text_formatter);
    postCmp.gen_tripcodes(tripcode_gen.gen_tripcode);

    api.bridge.controller("posts", "set_board", post_data.board_id);
    flush(postCmp.toString());
  });
}

module.exports = {
  handle_new_reply: handle_new_reply,
  handle_new_post: handle_new_post,
  handle_delete_post: handle_delete_post,
  handle_update_post: handle_update_post,
  render_posting: render_posting,
  trim_post: function(post) {
    var replies = post.replies;
    post.replies = [];
    _.each(replies, function(reply) {
      post.replies.push({
        id: reply.id,
        tripcode: reply.tripcode,
        created_at: reply.created_at
      });
    });

    // things we should remove from posts...
    // created_at, ip, id, replies, bumped_at, author, thread_id
    //
    // from replies:
    // ups, downs, bumped_at, author
    //
    var post_delete = [
      "ip",
    ];

    _.each(post_delete, function(key) {
      delete post[key];
    });

  }
};

