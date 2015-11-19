describe("A blank test for data", function() {
  it("should work", function(done) {
    SF.controller("data", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
