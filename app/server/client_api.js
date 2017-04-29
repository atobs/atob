var Post = require_app("models/post");
var posting = require_app("server/posting");
var Trophy = require_app("models/trophy");
var HIDDEN_BOARDS = require_app("server/hidden_boards");
var BoardClaim = require_app("models/board_claim");
var gen_md5 = require_app("server/md5");
var User = require_app("models/user");
var config = require_core("server/config");
var worship_boards = require_app("server/worship_boards");
var board_names = require_app("server/board_names");
var context = require_core("server/context");


var snorkel_api = require_app("server/snorkel_api");

// just a cache
var EMOTION_TABLE = {};


module.exports = {
  add_to_socket(s) {
    var prev_sample = null;
    s.spark.on("data", data => {
      if (data.data && data.data[0]) {
        var sample = snorkel_api.Sample("socketrcv");
        var prev_msg = "$";
        if (prev_sample) { prev_msg = prev_sample.data.string.msg; }
        prev_sample = sample;

        sample.integer("time", parseInt(+Date.now() / 1000, 10));
        sample.string("msg", data.data[0]);
        sample.string("prev_msg", prev_msg);

        snorkel_api.decorate_sample(sample, snorkel_api.DECO.browser_info, s.socket.request);
        sample.send();


      }
    });

    s.on("samples", (data, cb) => {
      if (data.samples && data.samples.length) {
        console.log("SOCKET RECEIVED", data.samples.length, "SAMPLES");
 
        s.socket.request.ip = s.socket.request.forwarded.ip;
        _.each(data.samples, sample => {
          snorkel_api.handle_json_sample(sample, s.socket.request);
        });
      }

      cb();
    });

    s.on("adminme", (board, author, tripcode, cb) => {
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
        tripcode
      }}).success(users => {
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
        } }).success(claims => {
          var hashtrip = gen_md5(author + ":" + tripcode);
          var isclaimed = false;
          var isowner = false;

          _.each(claims, claim => {
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

    s.on("try_claim_board", claim => {
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
      }).success(claims => {
        if (!claims.length) {
          BoardClaim.create({
            tripcode: hashtrip,
            author: tripname,
            approved: false,
            board_id: board
          });

          s.emit("notif", "A new board claim has been created for you, anon", "success");

          Post.create({
            board_id: board_names.MOD,
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

    s.on("chats", (delta, cb) => {
      // Find all posts older than delta ms
      var now = Date.now();
      now -= delta;

      console.log("Handling CHATs since", delta);

      Post.findAll({
        order: "id DESC",
        where: {
          board_id: board_names.CHAT,
        },
        limit: 50
      }).success(posts => {
        posts = _.filter(posts, p => p.created_at > now);

        cb(posts);
      });
    });

    s.on("since", (delta, cb) => {
      // Find all posts older than delta ms
      var now = Date.now();
      now -= delta;

      console.log("Handling API since", delta);

      Post.findAll({
        order: "id DESC",
        limit: 100
      }).success(posts => {
        posts = _.filter(posts, p => {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, board => {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden && p.created_at > now;
        });

        cb(posts);
      });
    });

    s.on("recent_posts", cb => {
      var after = _.after(2, () => {
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
      }).success(posts => {
        posts = _.filter(posts, p => {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, board => {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        ret.replies = posts;

        after();
      });

      Post.findAll({
        where: [
          "Posts.thread_id is NULL"
        ],
        order: "id DESC",
        limit: 100
      }).success(posts => {
        posts = _.filter(posts, p => {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, board => {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        ret.posts = posts;
        after();
      });


    });

    s.on("get_post_only", (post_id, cb) => {
      Post.find({
          where: { id: post_id }
      }).success(result => {
        if (result) {
          posting.trim_post(result);
        }

        cb(result);

      });
      


    });

    s.on("get_post", (post_id, cb) => {   
      console.log("Handling API get_post on", post_id);
      Post.find({
          where: { id: post_id },
          include: [
            { model: Post, as: "Children" }
          ]
      }).success(result => {
        var post_data = result.dataValues;
        if (result) {
          posting.trim_post(result);
          result.replies = _.map(result.children, c => c.dataValues );
          result.replies = _.sortBy(result.replies, d => new Date(d.created_at));
        }

        if (post_data.parent_id) {
          Post.find({
            where: { id: post_data.thread_id },
            include: [
              {model: Post, as: "Children" },
            ]
          }).success(parent => {
            if (!parent) {
              cb(result);
            } else {
              parent.replies = _.map(parent.children, c => c.dataValues );
              parent.replies = _.sortBy(parent.replies, d => new Date(d.created_at));

              posting.trim_post(parent);
              cb(parent);
            }
          });

        } else {
          cb(result);
        }

      });
      

    });

    s.on("get_trophies", (tripcode, cb) => {
      Trophy.findAll({where: { anon: tripcode }}).success(results => {
        cb(_.map(results, r => r.dataValues.trophy.replace(/:/g, "")));
      });
    });

    s.on("get_emotions", (tripcode, cb) => {

      if (EMOTION_TABLE[tripcode]) {
        cb && cb(EMOTION_TABLE[tripcode]);
        return;
      }



      Post.findAll({
        where: {
          tripcode
        }
      }).success(results => {
        var then = Date.now();
        if (results && results.length) {
          var sentiment = require("sentiment");

          var polarities = [];
          var subjectivities = [];

          _.each(results, r => {
            if (!r.text) {
              return;
            }
            var e = sentiment(r.text);
            polarities.push(e.score);
        
            subjectivities.push(e.comparative);
          });

          var avg_p = _.reduce(polarities, (m, o) => m + o, 0) / polarities.length;
          var avg_s = _.reduce(subjectivities, (m, o) => m + o, 0) / subjectivities.length;
          var done = Date.now();
          
          var emotions = {
            polarity: avg_p,
            subjectivity: avg_s,
            time: (done - then) / 1000
          };

          EMOTION_TABLE[tripcode] = emotions;
          _.delay(() => {
            delete EMOTION_TABLE[tripcode];
          }, 60 * 1000);

          cb && cb(emotions);
        }
      });
    });

    s.on("list_posts", (board_id, cb) => {
      console.log("Handling API list_posts on", board_id);
      var board_id_clause = board_id;
      var limit = 30;
      var order_clause = "bumped_at DESC";
      if (board_id === "to") {
        board_id_clause = null;
        order_clause = "created_at DESC";
        limit = 300;
      } else if (worship_boards.contains(board_id)) {
        order_clause = "created_at DESC";
      }

      var where = {};
      if (board_id_clause) {
        where.board_id = board_id_clause;
      }
      where.thread_id = null;
        Post.findAll({
            where,
            order: order_clause,
            limit
        }).success(results => {
          if (!results || !results.length) {
            return cb();
          }

          if (board_id === "to") {
            
            results = _.filter(results, r => { 
              var is_hidden = false;
              _.each(HIDDEN_BOARDS, board => {
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
          var counter = _.after(results.length, () => {
            cb(ret);
          });

          _.each(results, result => {
            var dataValues = result.dataValues;
            posting.trim_post(result);
            result.getChildren().success(children => {
              var post_data = dataValues;
              post_data.post_id = post_data.id;
              delete post_data.id;
              post_data.replies = _.map(children, c => c.dataValues );
              post_data.replies = _.sortBy(post_data.replies, d => {
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
