"use strict";

var DOINGS = {};
var LAST_UPDATE = {};
var SCHEDULED = {};
var SOCKETS = {};
var LAST_SEEN = {

};

var DOING_QUEUES = {};
var DOING_NOW = {};
var DOING_ONS = {};

var DEFAULT_TTL = 1; // 1 minute

var Post = require_app("models/post");


// TODO: have it prioritize the doings and set up the TTLs
function add_doing(sid, doing) {
  if (doing.what.match(":") && !doing.ttl) {
    // this should have a higher pri
    doing.pri = 10;
    doing.ttl = 30; // 30 minutes
  }

  LAST_SEEN[sid] = Date.now();

  DOING_QUEUES[sid] = DOING_QUEUES[sid] || [];
  DOING_QUEUES[sid].push(doing);
  doing.now = Date.now();

  module.exports.update_doings();
}

// parse DOING_QUEUES
function digest_doings() {
  var now = Date.now();

  DOING_ONS = {};
  DOING_NOW = {};
  module.exports.DOING_ONS = DOING_ONS;

  // So... we figure out
  _.each(DOING_QUEUES, function(queue, sid) {
    var next_queue = [];
    var max_doing = null;

    _.each(queue, function(doing) {
      var ttl = doing.ttl || DEFAULT_TTL;
      var pri = doing.pri || 0;
      var post_id = doing.post_id || 0;

      doing.ttl = ttl;
      doing.pri = pri;
      doing.post_id = post_id;


      if (now - doing.now < ttl * 1000 * 60) {
        next_queue.push(doing);

        if (!max_doing) {
          max_doing = doing;
        } else if (max_doing.pri <= pri) {
          max_doing = doing;
        } else if (doing.post_id && max_doing.post_id && doing.post_id !== max_doing.post_id) {
          max_doing = doing;
        }

      }


    });

    DOING_NOW[sid] = max_doing;

    if (max_doing) {
      DOING_ONS[max_doing.post_id] = DOING_ONS[max_doing.post_id] || {};
      DOING_ONS[max_doing.post_id][sid] = max_doing.what;
    }

    DOING_QUEUES[sid] = next_queue;

  });
}

function maybe_stalk(sid, doing, s) {
  if (doing.what === "stalking") {
    if (doing.anon === sid) {
      s.emit("bestalked");
      return;
    }

    var burtle_post = function(post) {
      post.dataValues.burtles += 1;
      post.save();

      var load_controller = require_core("server/controller").load;
      var boards_controller = load_controller("boards");
      var board_socket = boards_controller.get_socket();
      board_socket.broadcast.to(s.board).emit("burtled", post.dataValues.id, post.dataValues.burtles);

      var posts_controller = load_controller("posts");
      var post_socket = posts_controller.get_socket();
      post_socket.broadcast.to(s.board).emit("burtled", post.dataValues.id, post.dataValues.burtles);


    };

    Post.find(doing.post_id).success(function(res) {
      if (res.dataValues.parent_id) {
        Post.find(res.dataValues.parent_id).success(burtle_post);
      } else {
        burtle_post(res);
      }
    });

    var stalked_socket = SOCKETS[doing.anon];
    if (stalked_socket) {
      _.each(stalked_socket, function(s) {
        s.emit("bestalked", { by: sid, sid: doing.anon });
        s.emit("burtled", doing.post_id);

      });
    } else {
      s.emit("bestalked");
    }
  }
}

function subscribe_to_updates(s) {

  var sid = s.spark.headers.sid;
  SOCKETS[sid] = SOCKETS[sid] || [];
  SOCKETS[sid].push(s);

  function update_post_status(post_id) {
    digest_doings();
    var doings = {
      post_id: post_id,
      counts: _.map(DOING_ONS[post_id], function(v) { return v; })
    };

    var last_update = LAST_UPDATE[post_id];
    if (last_update && Date.now() - last_update < 1000) {
      // need to make sure this does happen eventually...
      clearTimeout(SCHEDULED[post_id]);
      SCHEDULED[post_id] = setTimeout(function() {
        delete SCHEDULED[post_id];
        update_post_status(post_id);
      }, 500);
      return;
    }

    LAST_UPDATE[post_id] = Date.now();

    var load_controller = require_core("server/controller").load;

    var boards_controller = load_controller("boards");
    var board_socket = boards_controller.get_socket();
    board_socket.broadcast.to(s.board).emit("doings", doings);
    s.emit("doings", doings);

    var posts_controller = load_controller("posts");
    var post_socket = posts_controller.get_socket();
    post_socket.broadcast.to(s.board).emit("doings", doings);

  }

  s.on("restalked", function(data) {
    // Find the SID they belong to?
    var stalked_socket = SOCKETS[data.by];
    if (stalked_socket) {
      _.each(stalked_socket, function(s) {
        s.emit("restalked");
      });
    }
  });

  // TODO: make a better schema for how this works
  s.on("isdoing", function(doing, cb) {
    var olddoing = s.isdoing || DOINGS[sid];
    DOINGS[sid] = s.isdoing = doing;

    maybe_stalk(sid, doing, s);
    add_doing(sid, doing);

    update_post_status(doing.post_id);
    if (olddoing) {
      update_post_status(olddoing.post_id);
    }

    if (cb) { cb(); }
  });

}


module.exports = {
  LAST_SEEN: LAST_SEEN,
  subscribe_to_updates: subscribe_to_updates,
  update_doings: _.throttle(function() {
    digest_doings();

    var load_controller = require_core("server/controller").load;
    var home_controller = load_controller("home");
    var boards_controller = load_controller("boards");
    var posts_controller = load_controller("posts");

    var now = Date.now();
    var last_seen = {};
    _.each(LAST_SEEN, function(then, sid) {
      var duration = now - then;
      if (duration > 60 * 60 * 3600) {
        delete LAST_SEEN[sid];
      } else {
        last_seen[sid] = duration;
      }
    });

    home_controller.get_socket().emit("anons", DOING_ONS, last_seen);
    boards_controller.get_socket().emit("anons", DOING_ONS, last_seen);
    posts_controller.get_socket().emit("anons", DOING_ONS, last_seen);
  }, 2000),

  lurk: function(s, board_id) {
    var sid = s.spark.headers.sid;


    var doing_word = "";
    LAST_SEEN[sid] = Date.now();
    if (board_id && board_id.length === 1) {
      if (Math.random() < 0.50) {
        doing_word = ":circle" + board_id + ":";
      } else {
        doing_word = ":square" + board_id + ":";
      }
    } else {
      // pick a random lurk icon?
      var icons = [ ":coffee:", ":cup-coffeealt:", ":mug:", ":coffeecupalt:", ":tea:", ":teapot:" ];
      doing_word = icons[_.random(icons.length-1)];
    }

    add_doing(sid, {
      what: doing_word,
      pri: -5,
      ttl: 60 // 60 minutes
    });


  },

  digest_doings: digest_doings


};
