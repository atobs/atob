var DUCKENINGS = {};
var MAX_DUCKS = 10;


var Post = require_app("models/post");
module.exports = {
  check: function(s, doing, stalked_socket, actortrip, bytrip) {
    var sid = s.spark.headers.sid;
    if (doing.what === "snooing") {

      s.emit("notif", "snoo meets burtle", "success");

      if (stalked_socket) {
        _.each(stalked_socket, function(s) {
          s.emit("snooed", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
      
    }

    if (doing.what === "kited") {
      s.emit("notif", "you are working towards mutually assured destruction", "error");
      s.emit("kited", { by: sid, sid: doing.anon, tripcode: actortrip });

      if (stalked_socket) {
        _.each(stalked_socket, function(s) {
          s.emit("notif", "you are working towards mutually assured destruction", "error");
          s.emit("kited", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
    }


    if (doing.what === "ducking") {
      if (!DUCKENINGS[sid]) {
        DUCKENINGS[sid] = 0;
      }

      DUCKENINGS[sid] += 1;
      _.delay(function() {
        DUCKENINGS[sid] -= 1;
      }, 30000); 

      if (DUCKENINGS[sid] >= _.random(3, MAX_DUCKS)) {
        s.emit("notif", "getting a bit greedy, anon?");
        for (var i = 0; i < _.random(2, 10); i++) {
          s.emit("duckened", { by: sid, sid: sid, tripcode: actortrip} );
        }
        return true;
      }

      s.emit("notif", "quack quack qua", "success");

      if (stalked_socket) {
        _.each(stalked_socket, function(s) {
          s.emit("duckened", { by: sid, sid: doing.anon, tripcode: actortrip });
        });
      }

      return true;
      
    }

    if (doing.what === "stalking") {
      var burtle_post = function(post) {
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

      Post.find(doing.post_id).success(function(res) {
        if (res.dataValues.parent_id) {
          Post.find(res.dataValues.parent_id).success(burtle_post);
        } else {
          burtle_post(res);
        }
      });

      if (stalked_socket) {
        _.each(stalked_socket, function(s) {
          s.emit("bestalked", { by: sid, sid: doing.anon, tripcode: actortrip });
          s.emit("burtled", doing.post_id);

        });
      } else {
        s.emit("bestalked");
      }


      var where_clause = {
        actor: actortrip,
        object: bytrip,
        action: "burtled",
      };


      if (!bytrip || !actortrip) {
        return true;
      }


      Action.find({ 
        where: where_clause
      }).success(function(action) {
        if (!action) {
          Action.create(where_clause);
        } else {
          action.increment("count", where_clause);
        }


      });

    }

    return true;

  }
};
