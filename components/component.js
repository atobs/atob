// Assume underscore and Backbone are already defined
var Component = Backbone.View.extend({
  tagName: 'div',

  className: 'cmp',

  init(options) {
    Backbone.View.init(options);
    this.__id = options.id;
  },

  dispose() {

  },

  appendTo(parent) {
    return this.$el.appendTo(parent);
  },

  prependTo(parent) {
    return this.$el.prependTo(parent);
  },

  append(content) {
    return this.$el.append(content);
  },

  prepend() {
    return this.$el.prepend(content);
  },

  parent(selector) {
    return this.$el.parent(selector);
  },

  html(content) {
    return this.$el.html(content);
  },

  render() {
    var modeled = this.$el.find("[data-model]");

    _.each(modeled, el => {
      var par = Backbone.$(el).parent("[data-cmp]");
    });
    // TODO: Fill these out with modeled values on updates
  },

  toString() {
    // yuck
    var outer = Backbone.$("<div />");
    outer.append(this.$el.clone());

    var out_html = outer.html();
    return out_html;
  }
});

module.exports = Component;
