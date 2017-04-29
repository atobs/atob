module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize(options) {
  },
  client(options) {
    $(document.body).append(this.$el);
    this.$el.find(".modal").modal();
    
    console.log("MADE ADMIN PANEL", this.$el);
  }
};
