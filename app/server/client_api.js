var Post = require_app("models/post");
var posting = require_app("server/posting");
var HIDDEN_BOARDS = require_app("server/hidden_boards");
var BoardClaim = require_app("models/board_claim");
var gen_md5 = require_app("server/md5");
var User = require_app("models/user");
var config = require_core("server/config");

module.exports = {
  add_to_socket: function(s) {
    s.on("adminme", function(board, author, tripcode, cb) {
      // For now, we assume yes...
      // ADMIN PANEL LETS YOU:
      // submit a claim for the board
      // configure the board
      // * description
      // * top post
      // * public or not
      // * post timeout?
      var secret = config.mod_secret || "mod_secret";
      var triphash  = gen_md5(author + secret + tripcode);
      var found = false;

      if (!tripcode || !author) {
        cb && cb(false, false);
        return;
      }

      User.findAll({where: {
        tripname: author,
        tripcode: tripcode
      }}).success(function(users) {
        if (users && users.length) {
          cb && cb(true, true);
          found = true;
          return;
        }

        if (_.contains(HIDDEN_BOARDS, board)) {
          cb && cb(true, false, "You can't claim this board, anon");
          return;
        }

        BoardClaim.findAll({ where: {
          board_id: board
        } }).success(function(claims) {
          var hashtrip = gen_md5(author + ":" + tripcode);
          var isclaimed = false;
          var isowner = false;

          _.each(claims, function(claim) {
            claim = claim.dataValues;
            if (claim.accepted) {
              isclaimed = true;
              if (claim.author === author && claim.tripcode === hashtrip) {
                isowner = true;
              }
            }
          });


          cb && cb(isclaimed, isowner);

        });
      });

    });

    s.on("try_claim_board", function(claim) {
      var tripcode = claim.tripcode.trim();
      var tripname = claim.tripname.trim();
      var hashtrip = gen_md5(tripname + ":" + tripcode);
      var reason = claim.reason;

      var board = claim.board.trim();

      if (_.contains(HIDDEN_BOARDS, board)) {
        s.emit("notif", "You can't claim this board, anon");
        return;
      }
      if (!board) {
        return;
      }

      BoardClaim.findAll({
        where: {
          tripcode: hashtrip,
          author: tripname,
          board_id: board,
          accepted: null
        }
      }).success(function(claims) {
        if (!claims.length) {
          BoardClaim.create({
            tripcode: hashtrip,
            author: tripname,
            approved: false,
            board_id: board
          });

          s.emit("notif", "A new board claim has been created for you, anon", "success");

          Post.create({
            board_id: "mod",
            author: tripname,
            tripcode: hashtrip,
            created_at: Date.now(),
            bumped_at: Date.now(),
            title: "Anon claims /" + board,
            text: reason || "we want to clean it up. we want to pretty it up. we want to make it up" 
          });
        } else {
          s.emit("notif", "You already have a pending claim on this board, anon", "warn");

        }

      });

    });

    s.on("chats", function(delta, cb) {
      // Find all posts older than delta ms
      var now = Date.now();
      now -= delta;

      console.log("Handling CHATs since", delta);

      Post.findAll({
        order: "id DESC",
        where: {
          board_id: "chat",
        },
        limit: 50
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          return p.created_at > now;
        });

        cb(posts);
      });
    });

    s.on("since", function(delta, cb) {
      // Find all posts older than delta ms
      var now = Date.now();
      now -= delta;

      console.log("Handling API since", delta);

      Post.findAll({
        order: "id DESC",
        limit: 100
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden && p.created_at > now;
        });

        cb(posts);
      });
    });

    s.on("recent_posts", function(cb) {
      var after = _.after(2, function() {
        cb(ret); 
      });

      var ret = {};
      Post.findAll({
        where: {
          parent_id: {
            ne: null
          },
        },
        order: "id DESC",
        limit: 100
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        ret.replies = posts;

        after();
      });

      Post.findAll({
        where: [
          "Posts.thread_id is NULL AND Posts.board_id != 'ban'"
        ],
        order: "id DESC",
        limit: 100
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        ret.posts = posts;
        after();
      });


    });

    s.on("get_post_only", function(post_id, cb) {
      Post.find({
          where: { id: post_id }
      }).success(function(result) {
        if (result) {
          posting.trim_post(result);
        }

        cb(result);

      });
      


    });

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
      } else if (board_id === "heretics" || board_id === "apostles" || board_id === "cleretics") {
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
            return cb();
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
