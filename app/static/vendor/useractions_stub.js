if (typeof window !== "undefined") {
  window._ET = {
    stack: [],
    start: +new Date(),
    local(...args) {
      this.stack.push(['local', _.toArray(args), +new Date()]);
      this.stack.length = Math.min(100, this.stack.length);
    },
    global(...args) {
      this.stack.push(['global', _.toArray(args), +new Date()]);
      this.stack.length = Math.min(100, this.stack.length);
    }
  };
}
