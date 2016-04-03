"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var Action = require_app("models/action");
var Trophy = require_app("models/trophy");
var sequelize = require_app("models/model");
var bridge = require_core("server/bridge");


function prepare_chart(name, options, cb) {
  // Render the time series
  // Posts
  // Trophies
  // Actions (5 in 1)
  var after = _.after(3, function() {
    bridge.controller("data", "render_" + name + "_charts");
    cb();
  });

  var func_name = "add_" + name + "_chart";


  // Render time of day, too...

  var one_week = (1000 * 60 * 60 * 24 * 7);
  var ago = new Date(+new Date() - (one_week*2));
  var defaults = { 
    order: "created_at ASC",
    where: {
    },
  };

  options = _.defaults(options, defaults);

  Post.findAll(options).success(function(results) {
    bridge.controller("data", func_name, "posts", results);
    after();
  });

  Trophy.findAll(options).success(function(results) {
    bridge.controller("data", func_name, "trophies", results);
    after();
  });


  // For the Actions table, we also want counts
  options.attributes.push(['SUM(count)', 'sum']);
  options.where.action = "burtled";

  var actions = ["burtled", "sunkship", "ducked", "pokeycursor", "madd"];
  var lookup = {
    "sunkship" : "battleships"
  };

  var miniafter = _.after(actions.length, function() {
    after();
  });

  _.each(actions, function(action) {
    options.where.action = action;
    Action.findAll(options).success(function(results) {
      bridge.controller("data", func_name, action, results);
      miniafter();
    });
  });

}

module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "" : "index",
    "all" : "all",
    "recent" : "recent",
  },
  post_routes: {
    "s" : "add_sample"
  },

  add_sample: function(ctx, api) {
    var snorkel_api = require_app("server/snorkel_api");

    var samples = ctx.req.body.samples;
    if (samples && samples.length) {
      console.log("RECEIVED", samples.length, "SAMPLES");
      _.each(samples, function(sample) {
        snorkel_api.handle_json_sample(sample, ctx.req);
      });
    } else if (ctx.req.body.sample) {
      snorkel_api.handle_json_sample(ctx.req.body.sample);
    }

    ctx.res.end("OK");
  },

  render_timeseries: function(ctx, api, recent) {
    var options = {
      group: "strftime('%Y/%m/%d', created_at)",
      attributes: [
        ['strftime("%Y/%m/%d", created_at)', 'created_hour'], 
        [sequelize.fn('COUNT', 'updated_at'), 'count'],
        ['MAX(id)', 'max_id'],
        ['strftime("%w", created_at)', 'day_of_week'], 
      ],
    };

    if (recent) {
      var one_week = (1000 * 60 * 60 * 24 * 7);
      var one_month_ago = new Date(+new Date() - one_week * 4);
      options.where = {
        created_at: { gt: one_month_ago.toISOString() }
      };
    };

    var async_timeseries = api.page.async(function(flush) {
      prepare_chart("timeseries", options, flush);
    });

    async_timeseries();
  },

  render_dayofweek: function(ctx, api, recent) {
    var options = { 
      group: "strftime('%w', created_at)",
      order: "created_at ASC",
      where: {
      },
      attributes: [
        ['strftime("%w", created_at)', 'created_hour'], 
        [sequelize.fn('COUNT', 'updated_at'), 'count'],
        ['strftime("%w", created_at)', 'day_of_week'], 
      ],
    };
    if (recent) {
      var one_week = (1000 * 60 * 60 * 24 * 7);
      var one_month_ago = new Date(+new Date() - one_week * 4);
      options.where = {
        created_at: { gt: one_month_ago.toISOString() }
      };
    }


    var async_dayofweek = api.page.async(function(flush) {
      prepare_chart("dayofweek", options, flush);
    });

    async_dayofweek();


  },
  render_timeofday: function(ctx, api, recent) {
    var options = { 
      group: "strftime('%H', created_at)",
      order: "created_at ASC",
      where: {},
      attributes: [
        ['strftime("%H", created_at)', 'created_hour'], 
        [sequelize.fn('COUNT', 'updated_at'), 'count'],
        ['strftime("%w", created_at)', 'day_of_week'], 
      ],
    };
    if (recent) {
      var one_week = (1000 * 60 * 60 * 24 * 7);
      var one_month_ago = new Date(+new Date() - one_week * 4);
      options.where = {
        created_at: { gt: one_month_ago.toISOString() }
      };
    }

    var async_timeofday = api.page.async(function(flush) {
      prepare_chart("timeofday", options, flush);
    });

    async_timeofday();
  },
  all: function(ctx, api, recent) {
    var template_str = api.template.render("controllers/data/data.html.erb", { recent: recent });

    module.exports.render_timeseries(ctx, api, recent);
    module.exports.render_timeofday(ctx, api, recent);
    module.exports.render_dayofweek(ctx, api, recent);
    api.page.render({ content: template_str });
  },
  index: function(ctx, api) {
    module.exports.recent(ctx, api);
  },
  recent: function(ctx, api) {
    module.exports.all(ctx, api, true /* recent only */);
  },

  socket: function() {}
};
