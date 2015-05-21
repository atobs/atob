function do_line(delay) {

    var burtle = $(".logo img");
    var w = $(window).width(), h = $(window).height();
    var burtles = [];
    var num_burtles = 20;
    var zoom = 1;
    var cur_x = 0;
    var step_x = w / num_burtles;
    for (var i = 0; i < num_burtles; i++) {
      cur_x += step_x;

      (function() {
        var logo = burtle.clone();
        logo.hide();
        var start_x = cur_x;
        var start_y = 0;

        logo.css({ position: "fixed", left: start_x, top: 0, zoom: zoom });

        $("body").append(logo);
        burtles.push(logo);
        logo.fadeIn();

        logo.velocity({ top: h }, { loop: 3, delay: i * delay, complete: function() {
          console.log("FINISHED REMOVE");
          logo.remove();
        }});
      })();

    }

}

module.exports = {

  storm: function() {

    var types = {
      swarm: 50,
      line: 50,
      cascade: 50,
      bounce: 50
    };


    var total = 0;

    _.each(types, function(val) {
      total += val;
    });

    var choice = _.random(0, total-1);
    _.each(types, function(val, key) {
      if (choice >= 0) {
        choice -= val;
        if (choice < 0) {
          module.exports[key]();
        }
      }
    });

  },

  bounce: function() {
    var burtle = $(".logo img").clone();
    $("body").append(burtle);

    var w = $(window).width(), h = $(window).height();
    burtle.css({ position: "fixed", left: w / 2, top: h / 2});
    for (var i = 0; i < 10; i++) {
      var options = [
        [_.random(0, w - 100), h - 100],
        [_.random(0, w - 100), 0],
        [0, _.random(0, h - 100)],
        [w - 100, _.random(0, h - 100)],
      ];

      var edge = options[_.random(0, 3)];

      burtle.velocity({
        left: edge[0],
        top: edge[1]
      }, {
        easing: "easeOutElastic"
      });
    }

    burtle.velocity({
      left: w / 2,
      top: h / 2
    });

    (function() {
      var thisb = burtle;
      burtle.velocity({
        scaleY: 20,
        scaleX: 20,
        opacity: 0,
      }, {
        complete: function() {
          thisb.remove();
        }
      });
    })();



  },

  swarm: function() {
    var burtle = $(".logo img");
    var w = $(window).width(), h = $(window).height();
    var burtles = [];
    var num_burtles = 20;
    var zoom = 1;
    for (var i = 0; i < num_burtles; i++) {
      var logo = burtle.clone();
      logo.hide();
      var start_x = w / zoom / 2;
      var start_y = h / zoom / 2;
      logo.css({ position: "fixed", left: start_x, top: start_y, zoom: zoom });

      $("body").append(logo);
      burtles.push(logo);
      logo.fadeIn();
    }

    var storms = 10;

    function do_storm() {
      if (storms <= 0) {
        _.each(burtles, function(burtle) {
          burtle.velocity({
            left: w / zoom / 2,
            top: h / zoom / 2
          });
          (function() {
            var thisb = burtle;
            burtle.velocity({
              scaleY: 20,
              scaleX: 20,
              opacity: 0,
            }, {
              complete: function() {
                thisb.remove();
              }
            });
          })();
        });
        return;
      }

      storms -= 1;

      _.each(burtles, function(logo) {
        var end_x = _.random(0, w / zoom);
        var end_y = _.random(0, h / zoom);

        logo.velocity({left: end_x, top: end_y}, { easing: "easeOutElastic" });
      });

      do_storm();

    }

    do_storm();
  },

  cascade: function() {
    do_line(50);
  },

  line: function() {
    do_line(20);
  }

};
