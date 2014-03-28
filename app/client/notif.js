module.exports = {
  handle_notif: function(msg, type, options) {
    options = options || {};
    options.className = type;
    options.position = "top right";
    $.notify(msg, options);
  }
};
