var DUCKENINGS = {};
var MAX_DUCKS = 10;
var Action = require_app("models/action");


var Post = require_app("models/post");
module.exports = {
  check(s, doing, stalked_socket, actortrip, bytrip) {
    var sid = s.spark.headers.sid;
    var where_clause = {
      actor: actortrip,
      object: bytrip
    };

    function do_action(name) {
      if (!bytrip) {
        bytrip = "anonanon";
      }
      if (!actortrip) {
        actortrip = "anonanon";
      }

      where_clause.action = name;
      Action.find({ 
        where: where_clause
      }).success(action => {
        if (!action) {
          Action.create(where_clause);
        } else {
          action.increment("count", where_clause);
        }
      });
    }


    if (doing.what === "snooing") {
      do_action("snooed");

      s.emit("notif", "snoo meets burtle", "success");

      if (stalked_socket) {
        _.each(stalked_socket, s => {
          s.emit("snooed", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
      
    }

    if (doing.what === "kited") {
      do_action("madd");
      s.emit("notif", "you are working towards mutually assured destruction", "error");
      s.emit("kited", { by: sid, sid: doing.anon, tripcode: actortrip });

      if (stalked_socket) {
        _.each(stalked_socket, s => {
          s.emit("notif", "you are working towards mutually assured destruction", "error");
          s.emit("kited", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
    }


    if (doing.what === "ducking") {
      do_action("ducked");

      if (!DUCKENINGS[sid]) {
        DUCKENINGS[sid] = 0;
      }

      DUCKENINGS[sid] += 1;
      _.delay(() => {
        DUCKENINGS[sid] -= 1;
      }, 30000); 

      if (DUCKENINGS[sid] >= _.random(3, MAX_DUCKS)) {
        s.emit("notif", "getting a bit greedy, anon?");
        for (var i = 0; i < _.random(2, 10); i++) {
          s.emit("duckened", { by: sid, sid, tripcode: actortrip} );
        }
        return true;
      }

      s.emit("notif", "quack quack qua", "success");

      if (stalked_socket) {
        _.each(stalked_socket, s => {
          s.emit("duckened", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
      
    }

    if (doing.what === "stalking") {
      do_action("burtled");

      var burtle_post = post => {
        post.dataValues.burtles += 1;
        require_app("server/makeme_store").bump_meter(2);
        post.save();

        var load_controller = require_core("server/controller").load;
        var boards_controller = load_controller("boards");
        var board_socket = boards_controller.get_socket();
        board_socket.broadcast.to(s.board).emit("burtled", post.dataValues.id, post.dataValues.burtles);

        var posts_controller = load_controller("posts");
        var post_socket = posts_controller.get_socket();
        post_socket.broadcast.to(s.board).emit("burtled", post.dataValues.id, post.dataValues.burtles);


      };

      if (doing.post_id !== "chat") {
        Post.find(doing.post_id).success(res => {
          if (res.dataValues.parent_id) {
            Post.find(res.dataValues.parent_id).success(burtle_post);
          } else {
            burtle_post(res);
          }
        });
      }

      if (stalked_socket) {
        _.each(stalked_socket, s => {
          s.emit("bestalked", { by: sid, sid: doing.anon, tripcode: actortrip });
          s.emit("burtled", doing.post_id);

        });
      } else {
        s.emit("bestalked");
      }



    }

    return true;

  }
};
