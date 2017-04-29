
var favorites = require("app/client/favorite_boards");
var storage = require("app/client/storage");

var sidebars = [];
var contentHandler;

function hide_sidebars() {
  _.each(sidebars, sidebar => {
    sidebar.hide();
    sidebar.data("opened", false);
  });
}

var sidebarOffset = "-102%";
function make_sidebar(toggle_selector, content_selector, side) {
  var events = _.clone(Backbone.Events);

  var sidebar_el = $("<div />");
  events.el = sidebar_el;

  if (content_selector) {
    var oldArea = $(content_selector);
    oldArea.find("input").each(function() {
      $(this).attr("value", $(this).val());
    });

    sidebar_el.append(oldArea.html());
  }

  sidebars.push(sidebar_el);
  sidebar_el.addClass("sidr " + side);

  $("body").append(sidebar_el);

  var logobarEl = $("#logobar");
  var logobarLeft = 0;
  if (logobarEl.length) {
    logobarLeft = parseInt(logobarEl.css("left").replace(/px/, ""), 10);
  }

  var nav_selector = ".navbar_helper .logo";

  $(toggle_selector).on("click", e => {
    console.log("TOGGLE SELECTOR CLICKED");
    e.stopPropagation();
    e.preventDefault();

    var was_opened = sidebar_el.data("opened");


    var side_name = side;
    var other_side_name = side === "right" ? "left" : "right";
    var options = {};
    if (!was_opened) {
      hide_sidebars();


      bootloader.require("app/static/vendor/velocity", () => {
        if (side === "right") {
          sidebar_el.css({
            right: sidebarOffset,
            display: "block",
            left: "auto"
          });

          sidebar_el.show();
          sidebar_el.velocity({
            right: 0
          });
        } else {
          sidebar_el.css({
            left: sidebarOffset,
            display: "block",
            right: "auto"
          });

          sidebar_el.show();
          sidebar_el.velocity({
            left: 0
          });
        }



        if (!contentHandler) {
          contentHandler = true;

          $(".content").one("click.sidebar", e => {
            console.log("ONE CLICK SIDEBAR");

            if ($(e.target).closest(".logo").length) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            contentHandler = false;

            hide_sidebars();
          });

        }

        $(".navbar_helper .logo img").velocity({
          rotateZ: "220deg"
        }).velocity({
          rotateZ: "360deg",
          easing: "in-out"
        });



      });

      events.trigger("opened");


    } else {
      $(".navbar_helper .logo img").velocity({
        rotateZ: "220deg"
      }).velocity({
        rotateZ: "360deg",
        easing: "in-out"
      });

      var anim_options = {};
      anim_options[side_name] = sidebarOffset;
      sidebar_el.velocity(anim_options, () => { });
      options[side_name] = "0px";
      options[other_side_name] = "auto";
      $(nav_selector).velocity(options);

      $("#logobar").css(side_name, logobarLeft + "px");
      options.position = "auto";
      events.trigger("closed");

      $(".content").off("click.sidebar");
      contentHandler = false;


    }

    sidebar_el.data("opened", !was_opened);
    $("#logobar").hide().show(0);
  });

  return events;


}


function add_sidebars() {
  var use_sidebars = storage.get("use_sidebars") === "true";
  if (!window._cordovaNative && !use_sidebars) {
    // Just unhide the boardlinks, then
    _.delay(() => {
      $(".boardlinks").fadeIn();
    }, 200);

    // Just put the favorites into the page
    favorites.render_favorites();
    return;
  }



  var sidebarEl = $("input.use_sidebars");
  sidebarEl.attr("checked", true);
  sidebarEl.prop("checked", true);

  $(".toptop").fadeOut();

  bootloader.css("jquery.sidr.light", () => {
    if (window._addedSidebars) {
      return;
    }
    window._addedSidebars = true;


    var sidebar_events = make_sidebar("#logobar .logo", "", "left");
    console.log("SETTING CONTAINER", sidebar_events.el);
    favorites.set_container(sidebar_events.el);
    favorites.render_favorites();

    sidebar_events.on("opened", () => {
      console.log("RENDERING FAVORITES?");
      favorites.render_favorites();
    });

    // end home link


    // add benjamin button directly into the sidebar
    sidebar_events = make_sidebar("a.settingslink", ".navbar .settings", "right");
    sidebar_events.on("opened", () => {
      var tripcodes_button = $("a.tripcode_done");
      tripcodes_button.hide();

      tripcodes_button = $("a.tripcode_history");
      tripcodes_button.hide();

      var benjamin_buttons = $(".benjamin_button");
      benjamin_buttons.show();

      if (!benjamin_buttons.closest(".sidr").length) {
        tripcodes_button.closest(".sidr").append(benjamin_buttons);
      }


      benjamin_buttons.removeClass("collapse");
      require("app/client/settings").regen_tripcode_history();

    });


    $(".sidr .boardlink").on("click", () => {
      hide_sidebars();
    });

    // append a /home link to the navlinks, too
    var link_sidebar = $(".sidr .boardlink")[0];
    var home_link = $(link_sidebar).clone();
    home_link.find("a")
      .attr("href", "/")
      .html("HOME");
    $(link_sidebar).parent().prepend(home_link);

    $(".sidr h2.identity").remove();
    $(".sidr .boardlink").css("width", "100%");

  });
}


module.exports = {
  add_sidebars
};

