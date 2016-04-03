var Instrumentation = require("app/static/vendor/useractions");

module.exports = {
  init: function() {
    this.init = function() { };


    var storage = window.bootloader.storage;
    var last_send = Date.now();
    var throttled_send = function() {
      if (Date.now() - last_send < 10000) {
        setTimeout(throttled_send, 500);
        return;
      }

      last_send = Date.now();

      var samples = JSON.parse(storage.get("__samples") || "[]");
      if (samples && samples.length > 0) {
        if (SF.socket()) {
          SF.socket().emit("samples", { samples: samples}, function() {
            storage.set("__samples", "");
          });
        } else if (samples.length > 30) {
          $.post("/d/s", { samples: samples }, function() {
            // Empty the local storage if the POST was successful
            storage.set("__samples", "");
          });
        }
      }
    };
    throttled_send();


    Instrumentation.Sample.__send = function(sample, meta) {
      var samples = JSON.parse(storage.get("__samples") || "[]");
      if (!samples) {
        samples = [];
      }

      samples.push(sample);

      // Hold the UTC timestamp in the sample, too
      if (!sample.__ts) {
        sample.__ts = new Date(Date.now()).toISOString();
      }

      storage.set("__samples", JSON.stringify(samples));

      // only post timespent data like every 15 minutes worth or so
      if (meta.dataset !== "timespent" || samples.length > 15) {
        throttled_send();
      }

    };

    Instrumentation.init();
  }
}
