"use strict";

var COLORS = {};
var color_idx = 0;
var COLOR_SCALE;
var get_color = function(key) {
  if (!COLOR_SCALE) {

    COLOR_SCALE = d3.scale.category10();
    for (var i = 0; i < 10; i++) {
      COLOR_SCALE(i);
    }
  }

  if (!COLORS[key]) {
    COLORS[key] = COLOR_SCALE(color_idx++);
  }

  return COLORS[key];

}

var render_delay = 50;
function render_chart(options) {
  var charts = options.charts;
  var x_func = options.value_func;
  var container = options.into;
  var data = [];
  var chart_type = options.type || "bar";

  // stupid me to name the action "burtled"
  var enabled_charts = [ "posts", "trophies", "burtled", "sunkship" ];
  var names = {
    "burtled" : "burtles",
    "sunkship" : "battleships",
    "trophies" : "butts stuffed"
  };

  bootloader.require("app/static/vendor/plotly-latest.min", function() {
    _.each(enabled_charts, function(key) {
      var chart_data = charts[key];
      var chart_name = names[key] || key;
      var labels = [];
      var series = [];

      chart_data = _.sortBy(chart_data, options.sort);


      var running_sum = 0;
      _.each(chart_data, function(d) {
        labels.push(x_func(d.created_hour));
        var val = d.sum || d.count;
        if (options.running_sum) {
          running_sum += val;
          series.push(running_sum);
        } else {
          series.push(val);
        }
      });

      var trace_data = {
        x: labels,
        y: series,
        color: get_color(key),
        marker: {
          color: get_color(key)
        },
        line: {
          color: get_color(key),
          width: 4,
        },

        name: chart_name,
        yaxis: "y",
        mode: "line",
        opacity: 1,
        type: chart_type
      };

      if (key === "posts") {
        trace_data.yaxis = "y2";
        trace_data.type = "scatter";
      }

      data.push(trace_data);

    });

    _.delay(function() {
      window.Plotly.newPlot(container, data, {
        title: options.title,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        barmode: "grouped",
        yaxis: {
          title: "activity",
          side: "left",
        },
        yaxis2: {
          side: "right",
          overlaying: "y",
          title: "posts"
        }
      }, render_delay);

      render_delay += 500;

      $(".loading").remove();
      $("#" + container + " .modebar").hide();
    });


  });
}

module.exports = {
  events: {

  },
  add_timeseries_chart: function(key, data) {
    this.timeseries_charts = this.timeseries_charts || {};
    this.timeseries_charts[key] = data;
  },
  add_timeofday_chart: function(key, data) {
    this.timeofday_charts = this.timeofday_charts || {};
    this.timeofday_charts[key] = data;
  },

  add_dayofweek_chart: function(key, data) {
    this.dayofweek_charts = this.dayofweek_charts || {};
    this.dayofweek_charts[key] = data;

  },
  render_dayofweek_charts: function() {
    var DAYS = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ];
    render_chart({
      charts: this.dayofweek_charts,
      type: "bar",
      title: "activity by day of week",
      sort: 'day_of_week',
      value_func: function(x) {
        return DAYS[x];
      },
      into: "dayofweek_container"
    });
  },
  render_timeofday_charts: function() {
    render_chart({
      charts: this.timeofday_charts,
      type: "bar",
      title: "activity by time of day",
      sort: function(r) {
        return (parseInt(r.created_hour, 10) + 16) % 24;
      },
      value_func: function(x) {
        return (parseInt(x, 10) + 16) % 24;
      },
      into: "timeofday_container"
    });
  },
  render_timeseries_charts: function() {
    var prev_max = null;
    _.each(this.timeseries_charts.posts, function(d) {
      var delta = d.max_id - prev_max;
      d.count = delta;
      prev_max = d.max_id;
    });

    render_chart({
      charts: this.timeseries_charts,
      type: "scatter",
      title: "activity",
      running_sum: true,
      sort: 'created_at',
      value_func: function(x) {
        return new Date(x);
      },
      into: "timeseries_container"
    });

  },
  init: function() {

  }
};
