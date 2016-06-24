if (typeof window !== "undefined") {
  window._ET = {
    stack: [],
    start: +new Date(),
    local: function() {
      this.stack.push(['local', _.toArray(arguments), +new Date()]);
      this.stack.length = Math.min(100, this.stack.length);
    },
    global: function() {
      this.stack.push(['global', _.toArray(arguments), +new Date()]);
      this.stack.length = Math.min(100, this.stack.length);
    }
  };
}
