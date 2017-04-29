module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize(options) {
  },
  client(options) {
    var client_options = options.client_options;

    $(document.body).append(this.$el);
    this.$el.find(".modal").modal();

    this.$el.find("input[name='author']").val(SF.controller().get_handle());
    this.$el.find("input[name='tripcode']").val(SF.controller().get_tripcode());
    this.$el.find("input[name='triphash']").val(SF.controller().get_triphash());
    this.$el.find("input[name='author']").attr("disabled", true);
    this.$el.find("input[name='tripcode']").attr("disabled", true);

    var tripbar = $(".identity_tripcode.tripbar").clone();
    tripbar.removeClass("identity_tripcode");
    this.$el.find(".form-horizontal").prepend(tripbar);
  }
};
