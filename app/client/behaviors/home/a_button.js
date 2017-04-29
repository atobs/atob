module.exports = {
  events: {
    "click" : "sample_click"
  },

  sample_click() {
    $("#clickit")
      .html("nice job :)")
      .fadeIn();
  }
}
