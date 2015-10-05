module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function(options) {
  },
  client: function(options) {
    $(document.body).append(this.$el);
    this.$el.find(".modal").modal();
    
    console.log("MADE ADMIN PANEL", this.$el);
  }
};
