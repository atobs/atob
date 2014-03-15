module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function(options) {
    if (options.replies && options.replies.length) {
      console.log("Has replies", options.replies);
    }
  },
  client: function(options) {
    var client_options = options.client_options;

    console.log("Client loaded", this, client_options);
  }
};
