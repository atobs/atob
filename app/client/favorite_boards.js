
var storage = require("app/client/storage");
var FAVORITES;
function load_favorites() {
  FAVORITES = JSON.parse(storage.get("favorite_boards") || '["a", "to", "b", "links", "gifs", "chat" ]');
}
load_favorites();

var TEMP_FAVORITES = [];
var board_id_set = false;

var COLORS = [ 
  "rgb(224, 144, 192)",
  "rgb(0, 160, 224)",
  "rgb(112, 176, 48)",
  "rgb(240, 80, 48)",
  "rgb(208, 192, 64)",
];
COLORS = _.shuffle(COLORS);

module.exports = {
  add_favorite: function(board) {
    load_favorites();
    if (_.contains(FAVORITES, board)) {
      return;
    }

    FAVORITES = _.without(FAVORITES, board);
    FAVORITES.push(board);
    TEMP_FAVORITES = _.without(TEMP_FAVORITES, board);

    $.notify("anon starred /" + board, "success");

    storage.set("favorite_boards", JSON.stringify(FAVORITES));
    module.exports.render_favorites();
  },
  del_favorite: function(board) {
    load_favorites();
    FAVORITES = _.without(FAVORITES, board);
    TEMP_FAVORITES = _.without(TEMP_FAVORITES, board);
    TEMP_FAVORITES.push(board);

    $.notify("anon unstarred /" + board);
    storage.set("favorite_boards", JSON.stringify(FAVORITES));
    module.exports.render_favorites();

  },
  really_render_favorites: function(div) {

    var board_id = SF.controller().board;
    var board_on_list = false;

    var index = 0;

    function build_board_tile(f, temp) {
      index += 1;
      index %= COLORS.length;

      var favEl = $("<li class='col-md-4 col-xs-4 favorite_board'> </li>");
      favEl.addClass("desaturate brighten");

      favEl.css({
        backgroundColor: COLORS[index]
      });

      var spanEl = $("<span>/" + f + "</span>");
      favEl.append(spanEl);
      spanEl.css({
        color: "#fff",
        padding: "10px"
      });

      if (f == board_id) {
        board_on_list = true;
      }
      
      var delFavEl = $("<small title='Remove board from favs' class='del icon-star'> </small>");
      if (temp) {
        var delFavEl = $("<small title='Add board to favs' class='add icon-star-empty'> </small>");
      }

      delFavEl.css({
        position: "absolute",
        lineHeight: "20px",
        top: 5,
        right: 5
      });
      delFavEl.on("click", function() {
        if (temp) {
          module.exports.add_favorite(f);

        } else {
          module.exports.del_favorite(f);
        }
      });

      favEl.data("board_id", f);
      favEl.append(delFavEl);
      favEl.on("click", function() {
        favEl.velocity({
          opacity: 0.2
        }, {
          complete: function() {
            window.location = "/b/" + f; 
          }
        });
      });

      div.append(favEl);

      return div;
    }

    _.each(FAVORITES, function(f) {
      build_board_tile(f);
    });

    _.each(TEMP_FAVORITES, function(f) {
      build_board_tile(f, true);
    });



    if (!_.contains(FAVORITES, board_id)) {
      if (!_.contains(TEMP_FAVORITES, board_id)) {
        build_board_tile(board_id, true);
      }
    }


  },
  render_favorites: function() {
    $("#favorite_boards").remove();

    var wrapper = $("<div id='favorite_boards' class='container mbl mtl ptl'> </div>");
    wrapper.css({
      marginBottom: "100px"
    });
    var div = $("<div class='col-md-12 ptl mtl'/>");
    div.css('list-style', 'none');

    wrapper.append(div);

    if (!board_id_set) {
      SF.controller().on("set_board", function() {
        module.exports.really_render_favorites(div);
      });
      board_id_set = true;
      
    } else {
      module.exports.really_render_favorites(div);

    }

    $(".content").append(wrapper);

  },
  get: function() {
    load_favorites();
    return FAVORITES;
  }
  

};
