module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize(options) {
    console.log("Loaded", this, options);
  },
  client(options) {
    var client_options = options.client_options;

    this.$el.find(".modal").modal();
    $(document.body).append(this.$el);
  }
};
