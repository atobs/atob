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

  handle_click_save: function() {

    var triphash = this.$el.find("input[name='triphash']").val();
    var tripname = this.$el.find("input[name='author']").val();
    var desc = this.$el.find("textarea[name='reason']").val();

    var board = SF.controller().board;

    // Save this tripcode forever, just in case...
    SF.controller().remember_tripcode_forever(tripname, SF.controller().get_tripcode()); 
    SF.socket().emit("try_claim_board", {
      tripcode: triphash,
      tripname: tripname,
      reason: desc,
      board: board
    });

    this.$el.find(".modal").modal("hide");

  },
  handle_click_cancel: function() {
    this.$el.find(".modal").modal("hide");

  }

};
