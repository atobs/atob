"use strict";

module.exports = {
  events: {
    "submit form" : "add_post" 
  },
  add_post: function(e) {
    console.log("Adding a new post");

    e.preventDefault();
  },
  init: function() {
    console.log("Seeing whats up");

  }
};
