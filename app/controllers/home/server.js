"use strict";

var Board = require_app("models/board");

var Sequelize = require("sequelize");
var $ = require("cheerio");
var ArchivedPost = require_app("models/archived_post");
var Post = require_app("models/post");
var Link = require_app("models/link");
var gen_md5 = require_app("server/md5");
var posting = require_app("server/posting");
var render_posting = posting.render_posting;


var ICONS = require_app("client/emojies");

var ICON_GROUPS = _.groupBy(ICONS, function(icon, index) {
  return parseInt(index / 50, 10);
});

var HIDDEN_BOARDS = [ "heretics", "faq", "bugs", "log", "mod", "cop", "ban", "test", "chat"];
var SLOGANS = [
  "Eting your children since february",
  "Establishing hippy communes since 2014",
  "where James vs. John was decided",
  "totally not being sarcastic about enslvaving the children",
  "where great minds -- HHHnnnnnnggghhhh -- ",
  "home of the serial shitter",
  "HULK SMASH!",
  "a less degenerate 4chan",
  "JAMES JAMES JAMES JAMES hulk JAMES JAMES JAMES JAMES",
  "When you stare into the anon, the anon also stares into you",
  "where poop and colors combine to make magic",
  "where it is foretold that one day an anon shall achieve quadruple black and transcend humankind to take their place by JAMES's side",
  "Let us touch your poop",
  "Totally not racist toward the Japs",
  "where colors set you free and then -- oh hold on -- hnnnnnNnnNNÑÑÑÑGH",
  "Home of the incontinent",
  "taste the rainbow FUCK YOU SKITTLES",
  "many voices, one anon",
  "destroying battery power since 2014",
  "questioning purple since 2014",
  "no you don't fucking love science",
  "where you don't look crazy having conversations with yourself",
  "where colors go to die",
  "redefining purple",
  "spoiler alert",
  "50 or the void",
  "sloganeering our way to a brighter future",
  "where well adjusted people go to anon",
  "if i lose my privilege, what will i have left?"
];



var UPBOAT_TIMEOUT = 60 * 1000;


module.exports = {
  routes: {
    "" : "index",
    "rules" : "rules",
    "recent" : "recent",
    "anon" : "colors",
    "chat" : "chat",
    "links" : "links",
    "boards" : "boards",
    "gifs" : "gifs",
    "faq" : "faq",
    "archives" : "archives",
    "guide" : "about",
    "icons" : "icons",
    "robots.txt" : "robots"
  },

  
  boards: function(ctx, api) {
    var render_boards = api.page.async(function(flush) {
      Sequelize.instance.query("select board_id, count(*) as count from posts group by board_id order by count desc")
      .success(function(results) {
        if (results && results.length) {
          api.bridge.controller("home", "set_boards", results);
          results = _.shuffle(_.filter(results, function(r) {
            var is_hidden = false;
            _.each(HIDDEN_BOARDS, function(board) {
              is_hidden = is_hidden || board === r.board_id;
            });

            return r.count > 1 && !is_hidden && r.board_id != "a" && r.board_id != "b";
          }));

          var container = $("<div />");
          _.each(results, function(r) {
            var a = $("<a />");
            a.attr("href", "/b/" + r.board_id);
            a.attr("rel", Math.sqrt(r.count));
            a.html(r.board_id);

            container.append(" ");
            container.append(a);
          });

          api.bridge.controller("home", "gen_tagcloud");
          flush(container);
        }


      });

    });

    var template_str = api.template.render("controllers/boards/list.html.erb", {
      render_boards: render_boards,
    });

    api.bridge.controller("home", "init_tripcodes");

    api.page.render({
      content: template_str
    });


  },


  about: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob/about");

    var slogan = SLOGANS[_.random(SLOGANS.length)];

    // bring the slogans in over here
    var template_str = api.template.render("controllers/about.html.erb", {
      slogan: slogan

    });


    api.page.render({ content: template_str, socket: false});



  },

  archives: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob/archives");
    api.template.add_stylesheet("archive");

    var board_utils = require_app("server/board_utils");
    var render_boards = board_utils.render_boards();
    var render_recent_archives = api.page.async(function(flush) {
      var summarize = require_app("client/summarize");
      ArchivedPost.findAll({
        where: {
          thread_id: null,
          parent_id: null
        },
        order: "id DESC"
      }).success(function(posts) {
        posts = _.unique(posts, function(p) { return p.id; } );
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          title_only: true,
          summarize: summarize,
          archive: "a"
        });

        api.bridge.controller("home", "format_text");
        flush(template_str);
      });


    });

    var template_str = api.template.render("controllers/archives.html.erb", {
      render_boards: render_boards,
      render_archives: render_recent_archives
    });

    api.bridge.controller("home", "init_tripcodes");

    api.page.render({ content: template_str, socket: false});

  },

  chat: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");

    api.template.add_stylesheet("links");
    var render_recent_chats = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: {
            eq: "chat"
          },
        },
        order: "id DESC",
        limit: 50
      }).success(function(posts) {
        // Find the most recent thread
        var parent = null;
        _.each(posts, function(post) {
          if (post && !post.dataValues.parent_id && !parent) {
            parent = post;
          }
        });


        if (!parent && posts.length) {
          parent = posts[posts.length - 1];
        }

        if (!parent) {
          return flush();
        }
        parent.children = posts;
        render_posting(api, flush, parent);
      });
    });

    var template_str = api.template.render("controllers/chat.html.erb", {
      render_recent_posts: render_recent_chats,
      render_recent_threads: function() { },
      slogan: ""
    });

    api.bridge.controller("home", "join_chat");
    api.bridge.controller("home", "init_tripcodes");

    api.page.render({ content: template_str, socket: true});

  },

  recent: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");

    var summarize = require_app("client/summarize");

    api.template.add_stylesheet("links");
    var render_recent_posts = api.page.async(function(flush) {
      Post.findAll({
        where: {
          parent_id: {
            ne: null
          },
        },
        order: "id DESC",
        limit: 50
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts.slice(0, 15),
          summarize: summarize
        });
        api.bridge.controller("home", "show_recent_posts");
        flush(template_str);
      });
    });

    var render_recent_threads = api.page.async(function(flush) {
      Post.findAll({
        where: {
          thread_id: null
        },
        order: "id DESC",
        limit: 30
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        posts = _.first(posts, 10);

        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          summarize: summarize
        });

        api.bridge.controller("home", "show_recent_threads");
        flush(template_str);
      });
    });

    var slogan = SLOGANS[_.random(SLOGANS.length)];
    var template_str = api.template.render("controllers/recent.html.erb", {
      render_recent_posts: render_recent_posts,
      render_recent_threads: render_recent_threads,
      slogan: slogan
    });

    api.page.render({ content: template_str, socket: true});


  },

  index: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");

    var summarize = require_app("client/summarize");

    api.template.add_stylesheet("links");
    var render_recent_posts = api.page.async(function(flush) {
      Post.findAll({
        where: {
          parent_id: {
            ne: null
          },
        },
        order: "id DESC",
        limit: 50
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });
        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts.slice(0, 5),
          summarize: summarize
        });
        api.bridge.controller("home", "show_recent_posts");
        flush(template_str);
      });
    });

    var render_recent_threads = api.page.async(function(flush) {
      Post.findAll({
        where: {
          thread_id: null
        },
        order: "id DESC",
        limit: 30
      }).success(function(posts) {
        posts = _.filter(posts, function(p) {
          var is_hidden = false;
          _.each(HIDDEN_BOARDS, function(board) {
            is_hidden = is_hidden || board === p.board_id;
          });

          return !is_hidden;
        });

        posts = _.first(posts, 3);

        var template_str = api.template.partial("home/recent_posts.html.erb", {
          posts: posts,
          summarize: summarize
        });

        api.bridge.controller("home", "show_recent_threads");
        flush(template_str);
      });
    });

    var render_anons = function() {
      var counts = {};
      var load_controller = require_core("server/controller").load;
      var boards_controller = load_controller("boards");
      _.each(boards_controller.GOING_ONS, function(anons) {
        _.each(anons, function(emote, id) {
          counts[id] = emote;
        });
      });

      var lookup = {
        t: "icon-keyboardalt",
        f: "icon-glassesalt",
        u: "icon-glassesalt",
        s: "icon-ghost"
      };

      var str = _.map(counts, function(c, id) {
        var opacity = 1;
        var last_seen = boards_controller.LAST_SEEN[id];
        if (last_seen) {
          var diff = Date.now() - last_seen;
          opacity = (1 - diff / 3600 / 1000);
        }

        return "<i class='" + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' style='opacity:" + opacity + "' />";
      });

      return str.join(" ");
    };

    var render_recent_chats = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: {
            eq: "chat"
          },
        },
        order: "id DESC",
        limit: 30
      }).success(function(posts) {
        // Find the most recent thread
        var parent = null;
        _.each(posts, function(post) {
          if (post && !post.dataValues.parent_id && !parent) {
            parent = post;
          }
        });


        if (!parent && posts.length) {
          parent = posts[posts.length - 1];
        }

        if (!parent) {
          return flush("");
        }

        parent.children = posts;
        render_posting(api, flush, parent);
      });
    });


    var board_utils = require_app("server/board_utils");
    var render_boards = board_utils.render_boards();
    var template_str = api.template.render("controllers/home.html.erb", {
      render_boards: render_boards,
      render_anons: render_anons,
      render_recent_posts: render_recent_posts,
      render_recent_threads: render_recent_threads,
      render_recent_chats: render_recent_chats,
      slogan: SLOGANS[_.random(SLOGANS.length)]
    });

    api.page.render({ content: template_str, socket: true});
  },
  rules: function(ctx, api) {
    this.set_fullscreen(true);
    var template_str = api.template.partial("home/rules.html.erb", {} );

    api.page.render({ content: template_str});

  },
  icons: function(ctx, api) {
    var render_icons = function() {
      var icon_list = $("<div />");
      _.each(ICON_GROUPS, function(icons) {
        var async_work = api.page.async(function(flush) {
          var iconsEl = $("<div class='clearfix' />");
          _.each(icons, function(icon) {
            var divEl = $("<div class='col-sm-3' />");
            var iconEl = $("<i class='mrl' />");
            iconEl.addClass("icon-" + icon);
            divEl.append(iconEl);
            iconsEl.append(divEl);
            divEl.append(icon);
          });

          flush(iconsEl.html());
        });


        var async_pl = async_work();
        icon_list.append(async_pl);
      });

      return icon_list.html();

    };

    var template_str = api.template.partial("home/icons.html.erb", { 
      render_icons: render_icons
    });

    api.page.render({ content: template_str});

  },
  faq: function(ctx, api) {
    var template_str = api.template.partial("home/faq.html.erb", { });

    api.page.render({ content: template_str});

  },
  render_links: function(ctx, api, images_only) {
    this.set_fullscreen(true);
    this.set_title("atob/links");
    if (images_only) {
      this.set_title("atob/gifs");
    }

    api.template.add_stylesheet("links");
    var MAX_BUMP_AGE = 12;
    var url = require("url");
    var render_links = api.page.async(function(flush) {
      Link.findAll({ order: "post_id DESC", limit: 49, where: { image: images_only ? 1 : 0} }).success(function(links) {
          var content = $("<div class='container col-md-12 mtl mll' />");
          var max_ups = _.max(links, function(link) { return link.ups || 0; });
          links = _.sortBy(links, function(link) {
            var recency = (Date.now() - link.created_at) / 1000 / 60 / 60;
            var bump_amount = Math.max((MAX_BUMP_AGE - recency) / MAX_BUMP_AGE * max_ups.ups, 0);

            var amount = (link.ups || 0) + bump_amount;

            return -amount;
          });

          _.each(links, function(link) {
            link.dataValues.domain = url.parse(link.href).hostname;
            link.dataValues.id = link.id;
            link.dataValues.uppable = (Date.now() - link.updated_at > UPBOAT_TIMEOUT);
            link.dataValues.timeout = parseInt((UPBOAT_TIMEOUT - (Date.now() - link.updated_at))/1000, 10);
            var template_str = api.template.partial("home/link.html.erb", link.dataValues);

            content.append($(template_str));
          });

          api.bridge.controller("home", "gen_tripcodes");
          flush(content);
        });
      });

      var board_utils = require_app("server/board_utils");
      var render_boards = board_utils.render_boards();
      var board_slogan = "and lists";
      if (images_only) {
        board_slogan = "and other pics";
      }
      var template_str = api.template.render("controllers/links.html.erb", {
        render_links: render_links,
        render_boards: render_boards,
        tripcode: "",
        images: images_only,
        board_slogan: board_slogan
      });
      api.bridge.controller("home", "init_tripcodes");
      api.page.render({content: template_str, socket: true });

  },
  gifs: function(ctx, api) {
    this.render_links(ctx, api, true);
  },
  links: function(ctx, api) {
    this.render_links(ctx, api);
  },
  colors: function(ctx, api) {
    var hashes = [];
    this.set_fullscreen(true);
    api.template.add_stylesheet("home");
    Post.findAll({ 
      group: ["tripcode", "author"],
      order: "count DESC",
      where: {
        board_id: ["a", "b"]
      },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
        "tripcode",
        "author"
        ],
      }).success(function(groups) {
        var count = 0;
        _.each(groups, function(group) {
          if (group.dataValues.count) {
            hashes.push(group.dataValues);
            count += 1;
          }

        });

        var content = $("<div class='container mtl' />");
        _.each(hashes, function(hash) {
          var hashEl = $("<div class='col-xs-4 col-md-2 tripcode'>");
          hashEl.attr("data-tripcode", hash.tripcode);
          var opacity = Math.max(parseFloat(hash.count * 20) / count);
          hashEl.css("opacity", opacity);
          content.append(hashEl);
        });

        api.bridge.controller("home", "gen_tripcodes");
        api.page.render({content: content.toString() });


      });
  },
  robots: function(ctx) {
    ctx.res.end("User-agent: *\nDisallow: /");
  },

  socket: function(s) { 
    var load_controller = require_core("server/controller").load;
    var boards_controller = load_controller("boards");
    boards_controller.lurk(s); 
    boards_controller.subscribe_to_updates(s);

    s.on("new_reply", function(post, cb) {
      post.tripcode = Math.random() + "";
      posting.handle_new_reply(s, "chat", post, cb);
    });

    s.on("upboat", function(link_id, cb) {
      Link.find(link_id).success(function(link) {
        if (Date.now() - link.updated_at < UPBOAT_TIMEOUT) {
          if (cb) { cb(); }
          return;
        }

        link.ups += 1;
        link.save();

        if (cb) {
          cb();
        }
      });
    });
  }
};
