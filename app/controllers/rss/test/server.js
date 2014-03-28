describe("A blank test for rss", function() {
  it("should work", function(done) {
    SF.controller("rss", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
