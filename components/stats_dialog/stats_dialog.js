module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function(options) {
    console.log("Loaded", this, options);
  },
  client: function(options) {
    var client_options = options.client_options;

    this.$el.find(".modal").modal();
    var iframe = $("<iframe src='/d/' frameBorder='0' seamless='seamless' />");
    iframe.css({
      "width" : "100%",
      "height" : "500px",
      "overflow-x" : "hidden"
    });

    this.$el.find(".modal-body").append(iframe);
    $(document.body).append(this.$el);
  }
};
