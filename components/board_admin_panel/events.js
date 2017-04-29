"use strict";

module.exports = { 
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click .save" :  "handle_click_save",
    "click .cancel" :  "handle_click_cancel"
  },

  handle_click_save() {

    var triphash = SF.controller().get_triphash();
    var tripname = SF.controller().get_handle();
    var board = SF.controller().board;

    SF.socket().emit("update_board_config", {
      tripcode: triphash,
      tripname,
      board
    });

    this.$el.find(".modal").modal("hide");

  },
  handle_click_cancel() {
    this.$el.find(".modal").modal("hide");

  }
};
