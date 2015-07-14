var Post = require_app("models/post");
var posting = require_app("server/posting");
module.exports = {
  add_to_socket: function(s) {

    s.on("get_post", function(post_id, cb) {   
      console.log("Handling API get_post on", post_id);
      Post.find({
          where: { id: post_id },
          include: [
            { model: Post, as: "Children" }
          ]
      }).success(function(result) {
        if (result) {
          posting.trim_post(result);
        }

        var post_data = result.dataValues;

        if (post_data.parent_id) {
          Post.find({
            where: { id: post_data.thread_id },
            include: [
              {model: Post, as: "Children" },
            ]
          }).success(function(parent) {
            if (!parent) {
              cb(result);
            } else {
              posting.trim_post(parent);
              cb(parent);
            }
          });

        } else {
          cb(result);
        }

      });
      

    });
    s.on("list_posts", function(board_id, cb) {
      console.log("Handling API list_posts on", board_id);
      var board_id_clause = board_id;
      var limit = 30;
      var order_clause = "bumped_at DESC";
      if (board_id === "to") {
        board_id_clause = null;
        order_clause = "created_at DESC";
        limit = 300;
      } else if (board_id === "heretics") {
        order_clause = "created_at DESC";
      }

      var where = {};
      if (board_id_clause) {
        where.board_id = board_id_clause;
      }
      where.thread_id = null;
        Post.findAll({
            where: where,
            order: order_clause,
            limit: limit
        }).success(function(results) {
          if (!results || !results.length) {
            api.bridge.controller("boards", "no_posts");
            return flush();
          }

          if (board_id === "to") {
            
            results = _.filter(results, function(r) { 
              var is_hidden = false;
              _.each([ "heretics", "faq", "bugs", "log", "mod", "cop", "ban", "test"], function(board) {
                is_hidden = is_hidden || board === r.board_id;
              });

              return !is_hidden;
            });

            results = _.shuffle(results);
          }

          // add an old post, for fun
          var grabbag = results[_.random(10, results.length-1)];
          results = results.slice(0, 11);
          if (grabbag) {
            results.push(grabbag);
          }

          var ret = [];
          var counter = _.after(results.length, function() {
            cb(ret);
          });

          _.each(results, function(result) {
            var dataValues = result.dataValues;
            posting.trim_post(result);
            result.getChildren().success(function(children) {
              var post_data = dataValues;
              post_data.post_id = post_data.id;
              delete post_data.id;
              post_data.replies = _.map(children, function(c) { return c.dataValues; } );
              post_data.replies = _.sortBy(post_data.replies, function(d) {
                posting.trim_post(d);
                return d.id;
              });

              ret.push(result);
              counter();
            });
          });


      });
    });
  }
};
