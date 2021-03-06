"use strict";

var SID_TO_TRIP = {};
var DOINGS = {};
var LAST_UPDATE = {};
var SCHEDULED = {};
var SOCKETS = {};
var LAST_SEEN = {

};

var DOING_QUEUES = {};
var DOING_NOW = {};
var DOING_ONS = {};
var IDLE_ICONS = [ ":coffee:", ":cup-coffeealt:", ":mug:", ":coffeecupalt:", ":tea:", ":teapot:" ];
var IDLE_RE = IDLE_ICONS.join("|") + "|circle|square";

var DEFAULT_TTL = 1; // 1 minute

var Post = require_app("models/post");
var Action = require_app("models/action");

var METER_TOTAL = 1;
var METER_MAX = 200;
var METER_CLAUSE = {
  actor: "anon",
  object: "anon",
  action: "meter",
};

var main = require_app("main");
main.db_emitter.on("synced", function() {
  // This can only happen after the DB is sync'd...
  Action.find({ 
    where: METER_CLAUSE
  }).success(function(action) {

    if (action && action.dataValues) {
      METER_TOTAL = action.dataValues.count ;
    }

    console.log("Restored burtle meter to", METER_TOTAL);
  });
});

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

function digest_sockets() {
  _.each(SOCKETS, function(sockets, sid) {
    var next_sockets = [];
    var cur_length = sockets.length;
    _.each(sockets, function(s) {
      if (s.primus.connected) {
        next_sockets.push(s);
      }
      
      SOCKETS[sid] = next_sockets;
    });

    var now_length = next_sockets.length;
    if (now_length !== cur_length) {
      console.log("CLEANED UP ", cur_length - now_length, "SOCKETS FOR", sid);
    }

  });
}

// parse DOING_QUEUES
function digest_doings() {
  var now = Date.now();

  digest_sockets();

  DOING_ONS = {};
  DOING_NOW = {};
  module.exports.DOING_ONS = DOING_ONS;

  // So... we figure out what to do?
  var idle_count = 0;

  var doing_queue_keys = _.keys(DOING_QUEUES).reverse();
  _.each(doing_queue_keys, function(sid) {
    var queue = DOING_QUEUES[sid];
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
    DOING_QUEUES[sid] = next_queue;

    if (max_doing) {
      if (max_doing.what.match(IDLE_RE)) {
        idle_count++;
        if (idle_count >= 10) {
          delete DOING_NOW[sid];
          return;
        }
      }

      DOING_ONS[max_doing.post_id] = DOING_ONS[max_doing.post_id] || {};
      DOING_ONS[max_doing.post_id][sid] = max_doing.what;
    }


  });
}

var anonications = require_app("server/anonications");
function maybe_stalk(sid, doing, s) {

  if (doing.mytrip) {
    // Update trip labels, I guess
    SID_TO_TRIP[sid] = doing.mytrip;
  }

  var actortrip = SID_TO_TRIP[sid];
  var bytrip = SID_TO_TRIP[doing.anon];
  var stalked_socket = SOCKETS[doing.anon];
  if (doing.anon === sid) {
    s.emit("bestalked");
    return;
  }

  if (anonications.check(s, doing, stalked_socket, actortrip, bytrip)) {
    return true;
  }

}


var THIRD_EYES = {};
function blast_enlightenment() {
  _.each(THIRD_EYES, function(data, sid) {
    if (Date.now() - data.movement > 3000) {
      delete THIRD_EYES[sid];
    }
  });

  var load_controller = require_core("server/controller").load;
  var home_controller = load_controller("home");
  var boards_controller = load_controller("boards");
  var posts_controller = load_controller("posts");

  home_controller.get_socket().emit("thirdeye", THIRD_EYES);
  boards_controller.get_socket().emit("thirdeye", THIRD_EYES);
  posts_controller.get_socket().emit("thirdeye", THIRD_EYES);

  setTimeout(blast_enlightenment, 3000);
}

blast_enlightenment = _.throttle(blast_enlightenment, 200);

function subscribe_to_updates(s) {

  var sid = s.spark.headers.sid;
  SOCKETS[sid] = SOCKETS[sid] || [];
  SOCKETS[sid].push(s);

  function update_post_status(post_id) {
    digest_doings();

    var last_seen = {};
    var now = +Date.now();
    _.each(LAST_SEEN, function(then, sid) {
      var duration = now - then;
      if (duration > 60 * 60 * 3600) {
        delete LAST_SEEN[sid];
        delete SID_TO_TRIP[sid];
      } else {
        last_seen[sid] = duration;
      }
    });

    var doings = {
      post_id: post_id,
      counts: _.map(DOING_ONS[post_id], function(v) { return v; }),
      last_seen: _.map(DOING_ONS[post_id], function(v, sid) { return last_seen[sid]; })
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

      var sinkertrip = SID_TO_TRIP[sid];
      var sunktrip = SID_TO_TRIP[data.by];

      var where_clause = {
        actor: sinkertrip,
        object: sunktrip,
        action: "sunkship",
      };

      METER_TOTAL += 5;


      s.emit("notif", "you sunk anon's battleship", "success");
      _.each(stalked_socket, function(s) {
        s.emit("restalked");
      });

      if (!sinkertrip || !sunktrip) {
        return;
      }

      Action.find({ 
        where: where_clause
      }).success(function(action) {
        if (!action) {
          Action.create(where_clause);
        } else {
          action.increment("count", where_clause );
        }


      });



    }
  });

  function do_doing(doing) {
    var olddoing = s.isdoing || DOINGS[sid];
    DOINGS[sid] = s.isdoing = doing;

    add_doing(sid, doing);

    update_post_status(doing.post_id);
    if (olddoing) {
      update_post_status(olddoing.post_id);
    }

    if (doing.what.indexOf(":") != -1) {
      var actortrip = SID_TO_TRIP[sid] || "anonanonanon";
      Action.create({
        actor: actortrip,
        object: doing.what,
        action: "makeme"
      });
    }

  }

  // TODO: make a better schema for how this works
  s.on("isdoing", function(doing, cb) {
    do_doing(doing, cb);
    if (cb) { cb(); }


  });

  s.on("stalking", _.throttle(function(doing, cb) {
    var stalked = maybe_stalk(sid, doing, s);
    if (!stalked) {
      return;
    }

    do_doing(doing, cb);
    if (cb) { cb(); }
  }, 200));


  
  var enlighten_anon = function () {
    var actortrip = SID_TO_TRIP[sid] || "anonanonanon";

    Action.create({
      actor: actortrip,
      action: "pokeycursor"

    });
  };

  enlighten_anon = _.throttle(enlighten_anon, 30 * 1000);


  // need to track all third eyes, including old ones and then stuff
  s.on("thirdeye", function(data, cb) {
    if (DOING_NOW[sid]) {
      data.icon = DOING_NOW[sid].what;
    }

    THIRD_EYES[sid] = data;

    data.movement = Date.now();

    enlighten_anon();
    blast_enlightenment();

  });

  s.on("thirdeyerind", function(data, cb) {

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
        delete SID_TO_TRIP[sid];
      } else {
        last_seen[sid] = duration;
      }
    });

    home_controller.get_socket().emit("anons", DOING_ONS, last_seen);
    boards_controller.get_socket().emit("anons", DOING_ONS, last_seen);
    posts_controller.get_socket().emit("anons", DOING_ONS, last_seen);

    module.exports.update_meters();
  }, 2000),

  update_meters: _.throttle(function() {
    var load_controller = require_core("server/controller").load;
    var home_controller = load_controller("home");
    var boards_controller = load_controller("boards");
    var posts_controller = load_controller("posts");


    if (METER_TOTAL >= METER_MAX) {
      // TIME TO DO STUFF HERE?
      home_controller.get_socket().emit("burtledance");
      boards_controller.get_socket().emit("burtledance");
      posts_controller.get_socket().emit("burtledance");


      Action.create({
        actor: "everyanon",
        action: "burtlestorm"
      });

      console.log("METER MAXED OUT!");
      METER_TOTAL %= METER_MAX;
      METER_MAX *= 1.5;
    }
    METER_TOTAL %= METER_MAX;

    var meter_opts = {
      percent: METER_TOTAL,
      max: METER_MAX
    };


    Action.find({ 
      where: METER_CLAUSE
    }).success(function(action) {
      if (!action) {
        Action.create(METER_CLAUSE);
      } else {
        action.set("count", METER_TOTAL );
        action.save();
      }


    });


    home_controller.get_socket().emit("meter", meter_opts);
    boards_controller.get_socket().emit("meter", meter_opts);
    posts_controller.get_socket().emit("meter", meter_opts);


  }, 2000),

  add_lurker: function(sid, board_id) {
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
      doing_word = IDLE_ICONS[_.random(IDLE_ICONS.length-1)];
    }

    add_doing(sid, {
      what: doing_word,
      pri: -5,
      ttl: 60 // 60 minutes
    });
  },

  lurk: function(s, board_id) {
    var sid = s.spark.headers.sid;
    module.exports.add_lurker(sid, board_id);

  },

  digest_doings: digest_doings,
  add_doing: add_doing,
  bump_meter: function(s) {
    METER_TOTAL +=s ;
  }


};

